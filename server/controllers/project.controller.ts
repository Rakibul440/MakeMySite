import { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import openai from "../configs/openai.js";
import 'dotenv/config'
import { gemini } from "../configs/gemini.js";


// Controller Function to make Revision
export const makeRevision = async (req: Request, res: Response) => {

    const userId = req.userId;
    try {
        const { projectId } = req.params;
        const id = Array.isArray(projectId) ? projectId[0] : projectId;
        const { message } = req.body;



        const user = await prisma.user.findUnique({
            where: { id: userId }
        })

        if (!userId || !user) return res.status(401).json({ message: "Unauthorized" })

        // require atleast 2 credits point for make revision
        if (user.credits < 2) return res.status(403).json({ message: "Add more credits to make changes" })

        if (!message || message.trim() === "") return res.status(400).json({ message: "Please enter a valid prompt" })

        const currentProject = await prisma.websiteProject.findUnique({
            where: { id: id, userId: userId },
            include: {
                versions: true
            }
        })

        if (!currentProject) return res.status(404).json({ message: "Project Not found" })

        // update conversation and credits
        await prisma.conversation.create({
            data: {
                role: "user",
                content: message,
                projectId: id
            }
        })

        await prisma.user.update({
            where: { id: userId },
            data: {
                credits: { decrement: 2 }
            }
        })

        // Enhanced Prompt
        // const enhancedPromptResponse = await openai.chat.completions.create({
        //     model: `${process.env.AI_MODEL}`,
        //     messages: [
        //         {
        //             role: "system",
        //             content: `
        //                 You are a prompt enhancement specialist. The user wants to make changes to their website. Enhance their request to be more specific and actionable for a web developer.

        //                 Enhance this by:
        //                 1. Being specific about what elements to change
        //                 2. Mentioning design details (colors, spacing, sizes)
        //                 3. Clarifying the desired outcome
        //                 4. Using clear technical terms

        //                 Return ONLY the enhanced request, nothing else. Keep it concise (1-2 sentences).

        //             `
        //         },
        //         {
        //             role: "user",
        //             content: `User's Request : "${message}"`
        //         }
        //     ]
        // })

        const promptEnhanceResponseByGemini = await gemini.generateContent({
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            text: `
                                You are a prompt enhancement specialist. The user wants to make changes to their website. Enhance their request to be more specific and actionable for a web developer.

                                Enhance this by:
                                1. Being specific about what elements to change
                                2. Mentioning design details (colors, spacing, sizes)
                                3. Clarifying the desired outcome
                                4. Using clear technical terms

                                Return ONLY the enhanced request, nothing else. Keep it concise (1-2 sentences).

                            `,
                        }
                    ]
                },
                {
                    role: "user",
                    parts: [
                        {
                            text: `User's Request : "${message}"`
                        }
                    ]
                }
            ]
        })
        // const enhancedPrompt = enhancedPromptResponse.choices[0].message.content;

        let enhancedPromptByGemini = promptEnhanceResponseByGemini.response.text();
        enhancedPromptByGemini = enhancedPromptByGemini
            .replace(/```html/g, "")
            .replace(/```/g, "")
            .trim();

        await prisma.conversation.create({
            data: {
                role: "assistant",
                content: "Now making changes to your website...",
                projectId: id
            }
        })

        // const codeGenerationResponse = await openai.chat.completions.create({
        //     model: `${process.env.AI_MODEL}`,
        //     messages: [
        //         {
        //             role: "system",
        //             content: `
        //                 You are an expert web developer. 

        //                 CRITICAL REQUIREMENTS:
        //                 - Return ONLY the complete updated HTML code with the requested changes.
        //                 - Use Tailwind CSS for ALL styling (NO custom CSS).
        //                 - Use Tailwind utility classes for all styling changes.
        //                 - Include all JavaScript in <script> tags before closing </body>
        //                 - Make sure it's a complete, standalone HTML document with Tailwind CSS
        //                 - Return the HTML Code Only, nothing else

        //                 Apply the requested changes while maintaining the Tailwind CSS styling approach.

        //             `
        //         },
        //         {
        //             role: "user",
        //             content: `
        //                 Here is the current website code : "${currentProject.current_code}" 
        //                 The user wants this changes "${enhancedPrompt}"
        //             `
        //         }
        //     ]
        // })

        const codeGenerationResponseByGemini = await gemini.generateContent({
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            text:
                                `
                                You are an expert web developer. 

                                CRITICAL REQUIREMENTS:
                                - Return ONLY the complete updated HTML code with the requested changes.
                                - Use Tailwind CSS for ALL styling (NO custom CSS).
                                - Use Tailwind utility classes for all styling changes.
                                - Include all JavaScript in <script> tags before closing </body>
                                - Make sure it's a complete, standalone HTML document with Tailwind CSS
                                - Return the HTML Code Only, nothing else

                                Apply the requested changes while maintaining the Tailwind CSS styling approach.

                            `
                        }
                    ]
                },
                {
                    role: "user",
                    parts: [
                        {
                            text: `
                                Here is the current website code : "${currentProject.current_code}" 
                                The user wants this changes "${enhancedPromptByGemini}"
                             `
                        }
                    ]
                }
            ]
        })

        // const code = codeGenerationResponse.choices[0].message.content || "";

        let codeByGemini = codeGenerationResponseByGemini.response.text();
        codeByGemini = codeByGemini
            .replace(/```[a-zA-Z]*\n?/g, "")
            .replace(/```/g, "")
            .trim();

        // if code is not generated then increase credits
        if (!codeByGemini) {
            await prisma.conversation.create({
                data: {
                    role: 'assistant',
                    content: "Failed to generate code, Try again.",
                    projectId: id
                }
            })

            await prisma.user.update({
                where: { id: userId },
                data: {
                    credits: { increment: 5 }
                }
            })

            return;
        }

        const version = await prisma.version.create({
            data: {
                code: codeByGemini,
                description: "Changes made",
                projectId: id
            }
        })

        await prisma.conversation.create({
            data: {
                role: "assistant",
                content: "I've made the changes! Ready for Previewing",
                projectId: id
            }
        })

        await prisma.websiteProject.update({
            where: { id: id },
            data: {
                current_code: codeByGemini,
                current_version_index: version.id
            }
        })


        res.status(200).json({ message: "Changes made successfully" })

    } catch (error: any) {
        await prisma.user.update({
            where: { id: userId },
            data: {
                credits: { increment: 2 }
            }
        })
        console.log(error.code || error.message)
        res.status(500).json({ message: error.message })
    }

}

// Controller Function to rollback to a specific version
export const rollbackToVersion = async (req: Request, res: Response) => {

    const userId = req.userId;

    try {

        if (!userId) return res.status(403).json({ message: "Unauthorized" })

        const { projectId, versionId } = req.params;
        const project_id = Array.isArray(projectId) ? projectId[0] : projectId
        const version_id = Array.isArray(versionId) ? versionId[0] : versionId


        const project = await prisma.websiteProject.findUnique({
            where: { id: project_id, userId: userId },
            include: {
                versions: true
            }
        })

        if (!project) return res.status(404).json({ message: "Project not found" })

        const version = project.versions.find((version) => version.id == version_id)

        if (!version) return res.status(404).json({ message: "Version not found" })

        await prisma.websiteProject.update({
            where: { id: project_id, userId: userId },
            data: {
                current_code: version.code,
                current_version_index: version.id
            }
        })

        await prisma.conversation.create({
            data: {
                role: "assistant",
                content: "I've rollback your website to selected version. Ready to Preview",
                projectId: project_id
            }
        })

        res.status(200).json({ message: "Version rolled back" })

    } catch (error: any) {
        console.log(error.code || error.message)
        res.status(500).json({ message: error.message })
    }
}

// Controller Function to delete project
export const deleteProject = async (req: Request, res: Response) => {

    const userId = req.userId;
    try {
        if (!userId) return res.status(401).json({ message: "Unauthorized" })

        const { projectId } = req.params;
        const project_id = Array.isArray(projectId) ? projectId[0] : projectId

        await prisma.websiteProject.delete({
            where: { id: project_id, userId: userId }
        })

        res.status(200).json({ message: "Project Deleted Successfully" })

    } catch (error: any) {
        console.log(error.code || error.message)
        res.status(500).json({ message: error.message })
    }

}

// Controller for previewing Project
export const getPreviewProject = async (req: Request, res: Response) => {

    const userId = req.userId;
    try {
        if (!userId) return res.status(401).json({ message: "Unauthorized" })

        const { projectId } = req.params;
        const project_id = Array.isArray(projectId) ? projectId[0] : projectId

        const project = await prisma.websiteProject.findFirst({
            where: { id: project_id, userId: userId },
            include: {
                versions: true
            }
        })

        if (!project) return res.status(404).json({ message: "Project not found" })

        res.status(200).json({ project })

    } catch (error: any) {
        console.log(error.code || error.message)
        res.status(500).json({ message: error.message })
    }

}

// Get Published Project - Public everyone can see
export const getPublishedProjects = async (req: Request, res: Response) => {

    try {

        const projects = await prisma.websiteProject.findMany({
            where: { isPublished: true },
            include: {
                user: true
            }
        })

        res.status(200).json({ projects })

    } catch (error: any) {
        console.log(error.code || error.message)
        res.status(500).json({ message: error.message })
    }

}

// get single project with id
export const getSingleProject = async (req: Request, res: Response) => {

    try {

        const { projectId } = req.params;
        const project_id = Array.isArray(projectId) ? projectId[0] : projectId

        const project = await prisma.websiteProject.findFirst({
            where: { id: project_id }
        })

        if (!project || project.isPublished === false || !project?.current_code) return res.status(404).json({ message: "Project not found" })

        res.status(200).json({ code: project.current_code })

    } catch (error: any) {
        console.log(error.code || error.message)
        res.status(500).json({ message: error.message })
    }

}

// controller to save the project
export const saveProjectCode = async (req: Request, res: Response) => {

    const userId = req.userId

    try {

        if (!userId) return res.status(401).json({ message: "Unauthorized" })

        const { projectId } = req.params;
        const project_id = Array.isArray(projectId) ? projectId[0] : projectId

        const { code } = req.body;

        if (!code) return res.status(404).json({ message: "Code is required" })

        const project = await prisma.websiteProject.findUnique({
            where: { id: project_id, userId: userId }
        })

        if (!project) return res.status(404).json({ message: "Project not found" })

        await prisma.websiteProject.update({
            where: { id: project_id },
            data: {
                current_code: code,
                current_version_index: ""
            }
        })

        res.status(200).json({ message: "Project saved successfully" })

    } catch (error: any) {
        console.log(error.code || error.message)
        res.status(500).json({ message: error.message })
    }

}