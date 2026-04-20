import { Request, Response } from "express"
import prisma from "../lib/prisma.js";
import openai from "../configs/openai.js";
import dotenv from 'dotenv'
import { gemini } from "../configs/gemini.js";
dotenv.config()

// get user Credits
export const getUserCredits = async (req: Request, res: Response) => {

    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ message: "Unauthorized" })

        const user = await prisma.user.findUnique({
            where: { id: userId }
        })

        res.status(200).json({ credits: user?.credits })

    } catch (error: any) {
        console.log(error.code || error.message)
        res.status(500).json({ message: error.message })
    }

}

// controller Function to create new Projects
export const createUserProject = async (req: Request, res: Response) => {

    const userId = req.userId;
    try {
        const { initial_prompt } = req.body;

        if (!userId) return res.status(401).json({ message: "Unauthorized" })

        const user = await prisma.user.findUnique({
            where: { id: userId }
        })

        // each project cost 5 credits
        if (user && user.credits < 5) {
            return res.status(403).json({ message: 'Add credits to create more projects' })
        }

        // create new projects
        const project = await prisma.websiteProject.create({
            data: {
                name: initial_prompt.length > 50 ? initial_prompt.substring(0, 47) + '...' : initial_prompt,
                initial_prompt: initial_prompt,
                userId: userId
            }
        })

        // update user's total creation
        await prisma.user.update({
            where: { id: userId },
            data: {
                totalCreation: { increment: 1 }
            }
        })

        // create conversation 
        await prisma.conversation.create({
            data: {
                role: 'user',
                content: initial_prompt,
                projectId: project.id // that project is created above
            }
        })

        // reduce credits
        await prisma.user.update({
            where: { id: userId },
            data: {
                credits: { decrement: 5 }
            }
        })

        // Enhanced User prompt
        // const promptEnhanceResponse = await openai.chat.completions.create({
        //     model: `${process.env.AI_MODEL}`,
        //     messages: [
        //         {
        //             role: "system",
        //             content: `
        //             You are a prompt enhancement specialist. Take the user's website request and expand it into a detailed, comprehensive prompt that will help create the best possible website.

        //             Enhance this prompt by:
        //             1. Adding specific design details (layout, color scheme, typography,animation,theme,transition)
        //             2. Specifying key sections and features
        //             3. Describing the user experience and interactions
        //             4. Including modern web design best practices
        //             5. Mentioning responsive design requirements
        //             6. Adding any missing but important elements

        //             Return ONLY the enhanced prompt, nothing else. Make it detailed but concise (2-3 paragraphs max).
        //             `
        //         },
        //         {
        //             role: "user",
        //             content: initial_prompt
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
                                    You are a prompt enhancement specialist. Take the user's website request and expand it into a detailed, comprehensive prompt that will help create the best possible website.

                                    Enhance this prompt by:
                                    1. Adding specific design details (layout, color scheme, typography,animation,theme,transition)
                                    2. Specifying key sections and features
                                    3. Describing the user experience and interactions
                                    4. Including modern web design best practices
                                    5. Mentioning responsive design requirements
                                    6. Adding any missing but important elements

                                    Return ONLY the enhanced prompt, nothing else. Make it detailed but concise (2-3 paragraphs max).
                                `,
                        }
                    ]
                },
                {
                    role: "user",
                    parts: [
                        {
                            text: `Generate Enhanced prompt for : ${initial_prompt}`
                        }
                    ]
                }
            ]
        })

        // 
        // const enhancedPrompt = promptEnhanceResponse.choices[0].message.content;

        let enhancedPromptByGemini = promptEnhanceResponseByGemini.response.text();
        enhancedPromptByGemini = enhancedPromptByGemini
            .replace(/```html/g, "")
            .replace(/```/g, "")
            .trim();

        await prisma.conversation.create({
            data: {
                role: "assistant",
                content: `I've enhanced your prompt to : "${enhancedPromptByGemini}"`,
                projectId: project.id
            }
        })

        await prisma.conversation.create({
            data: {
                role: "assistant",
                content: 'Now generating your website...',
                projectId: project.id
            }
        })

        // generate website code
        // const codeGenerationResponse = await openai.chat.completions.create({
        //     model: `${process.env.AI_MODEL}`,
        //     messages: [
        //         {
        //             role: "system",
        //             content: `
        //                 You are an expert web developer. Create a complete, production-ready, single-page website based on this request: "${enhancedPrompt}"

        //                 CRITICAL REQUIREMENTS:
        //                 - You MUST output valid HTML ONLY. 
        //                 - Use Tailwind CSS for ALL styling
        //                 - Include this EXACT script in the <head>: <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
        //                 - Use Tailwind utility classes extensively for styling, animations, and responsiveness
        //                 - Make it fully functional and interactive with JavaScript in <script> tag before closing </body>
        //                 - Use modern, beautiful design with great UX using Tailwind classes
        //                 - Make it responsive using Tailwind responsive classes (sm:, md:, lg:, xl:)
        //                 - Use Tailwind animations and transitions (animate-*, transition-*)
        //                 - Include all necessary meta tags
        //                 - Use Google Fonts CDN if needed for custom fonts
        //                 - Use placeholder images from https://placehold.co/600x400
        //                 - Use Tailwind gradient classes for beautiful backgrounds
        //                 - Make sure all buttons, cards, and components use Tailwind styling
        //                 - For animation you may use framer motion , GSAP, anime.js 

        //                 CRITICAL HARD RULES:
        //                 1. You MUST put ALL output ONLY into message.content.
        //                 2. You MUST NOT place anything in "reasoning", "analysis", "reasoning_details", or any hidden fields.
        //                 3. You MUST NOT include internal thoughts, explanations, analysis, comments, or markdown.
        //                 4. Do NOT include markdown, explanations, notes, or code fences.

        //                 The HTML should be complete and ready to render as-is with Tailwind CSS.

        //                 `
        //         },
        //         {
        //             role: 'user',
        //             content: enhancedPrompt || ''
        //         }
        //     ]
        // })

        const codeGenerationResponseByGemini = await gemini.generateContent({
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            text: `
                                You are an expert web developer. Create a complete, production-ready, single-page website based on this request: "${enhancedPromptByGemini}"

                                CRITICAL REQUIREMENTS:
                                - You MUST output valid HTML ONLY. 
                                - Use Tailwind CSS for ALL styling
                                - Include this EXACT script in the <head>: <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
                                - Use Tailwind utility classes extensively for styling, animations, and responsiveness
                                - Make it fully functional and interactive with JavaScript in <script> tag before closing </body>
                                - Use modern, beautiful design with great UX using Tailwind classes
                                - Make it responsive using Tailwind responsive classes (sm:, md:, lg:, xl:)
                                - Use Tailwind animations and transitions (animate-*, transition-*)
                                - Include all necessary meta tags
                                - Use Google Fonts CDN if needed for custom fonts
                                - Use placeholder images from https://placehold.co/600x400
                                - Use Tailwind gradient classes for beautiful backgrounds
                                - Make sure all buttons, cards, and components use Tailwind styling
                                - For animation you may use framer motion , GSAP, anime.js 

                                CRITICAL HARD RULES:
                                1. You MUST put ALL output ONLY into message.content.
                                2. You MUST NOT place anything in "reasoning", "analysis", "reasoning_details", or any hidden fields.
                                3. You MUST NOT include internal thoughts, explanations, analysis, comments, or markdown.
                                4. Do NOT include markdown, explanations, notes, or code fences.

                                The HTML should be complete and ready to render as-is with Tailwind CSS.

                            `
                        }
                    ]
                },
                {
                    role: "user",
                    parts: [
                        {
                            text: enhancedPromptByGemini || ""
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
                    projectId: project.id
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

        // Create version for the project
        const version = await prisma.version.create({
            data: {
                code: codeByGemini,
                description: "Initial Prompt",
                projectId: project.id
            }
        })

        await prisma.conversation.create({
            data: {
                role: 'assistant',
                content: "I'v created your website! You can now preview it and request any changes.",
                projectId: project.id
            }
        })

        await prisma.websiteProject.update({
            where: { id: project.id },
            data: {
                current_code: codeByGemini,
                current_version_index: version.id
            }
        })

        res.status(200).json({ projectId: project.id })


    } catch (error: any) {
        await prisma.user.update({
            where: { id: userId },
            data: {
                credits: { increment: 5 }
            }
        })
        console.log(error.code || error.message)
        res.status(500).json({ message: error.message })
    }

}

// Controller Function to get single use projects
export const getUserProject = async (req: Request, res: Response) => {

    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ message: "Unauthorized" })

        const user = await prisma.user.findUnique({
            where: { id: userId }
        })

        const { projectId } = req.params;

        const id = Array.isArray(projectId) ? projectId[0] : projectId;

        const project = await prisma.websiteProject.findUnique({
            where: {
                id: id,
                userId: userId
            },
            include: {
                conversation: {
                    orderBy: { timestamp: "asc" }
                },
                versions: {
                    orderBy: { timestamp: 'asc' }
                }
            }
        })

        res.status(200).json({ project })

    } catch (error: any) {
        console.log(error.code || error.message)
        res.status(500).json({ message: error.message })
    }

}

// Controller function to get all user project
export const getAllProjects = async (req: Request, res: Response) => {

    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ message: "Unauthorized" })

        const user = await prisma.user.findUnique({
            where: { id: userId }
        })

        const projects = await prisma.websiteProject.findMany({
            where: { userId: userId },
            orderBy: { updatedAt: "desc" }
        })

        res.status(200).json({ projects })

    } catch (error: any) {
        console.log(error.code || error.message)
        res.status(500).json({ message: error.message })
    }

}

// Controller function to toggle project publish
export const toggleProjectPublish = async (req: Request, res: Response) => {

    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ message: "Unauthorized" })

        const user = await prisma.user.findUnique({
            where: { id: userId }
        })

        const { projectId } = req.params;
        const id = Array.isArray(projectId) ? projectId[0] : projectId;

        const project = await prisma.websiteProject.findUnique({
            where: { id: id, userId: userId }
        })

        if (!project) return res.status(401).json({ message: "Project not found" })

        await prisma.websiteProject.update({
            where: { id: id },
            data: {
                isPublished: !project.isPublished
            }
        })



        res.status(200).json({ message: project.isPublished ? "Project Unpublished" : "Project Published Successfully " })

    } catch (error: any) {
        console.log(error.code || error.message)
        res.status(500).json({ message: error.message })
    }

}

// controller Function for purchase credits
export const purchaseCredits = async (req: Request, res: Response) => {




}