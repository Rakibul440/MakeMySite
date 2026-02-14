import React, { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type { Project } from '../types'
import { ArrowBigDownDash, EyeIcon, EyeOffIcon, FullscreenIcon, LaptopIcon, Loader2Icon, MessageSquare, MessageSquareIcon, SaveIcon, SmartphoneIcon, TabletIcon, XIcon } from 'lucide-react'
import { dummyConversations, dummyProjects, dummyVersion } from '../assets/assets'
import Sidebar from '../components/Sidebar'
import ProjectPreview, { type ProjectPreviewRef } from '../components/ProjectPreview'

function Projects() {

  const {projectId} = useParams()
  const navigate = useNavigate()

  const previewRef = useRef<ProjectPreviewRef>(null)

  const [loading ,setLoading] = useState(true)
  const [project,setProject] = useState<Project|null>(null) 

  const [isGenerating,setIsGenerating] = useState(true)
  const [device ,setDevice] = useState<'phone' | 'tablet' | 'desktop'>("desktop")
  const [isMenuOpen,setIsMenuOpen] = useState(false)
  const [isSaving,setIsSaving] = useState(false)

  const togglePublish = async ()=>{

  }

  // download code (index.html)-or projectName.html
  const downloadCode = ()=>{
    const code = previewRef.current?.getCode() || project?.current_code; 

    if(!code){
      if(isGenerating){
        return
      }
      return
    }
    const element = document.createElement('a')
    const file = new Blob([code], {type: "text/html"});
    element.href = URL.createObjectURL(file);
    element.download = "index.html"

    document.body.appendChild(element)
    element.click()

    URL.revokeObjectURL(element.href)

  }

  const saveProject = ()=>{

  }

  const fetchProject = async ()=>{
    const project = dummyProjects.find(project=> project.id === projectId)
    setTimeout(()=>{
      if(project){
        setProject({...project, conversation : dummyConversations,versions:dummyVersion})
        setLoading(false)
        setIsGenerating(project.current_code ? false : true)
      }
    },2000)
  }

  useEffect(()=>{
    fetchProject()
  },[])

  if(loading){
    return (
      <>
        <div className='flex items-center justify-center h-screen'>
          <Loader2Icon className='size-7 animate-spin text-violet-200'/>
        </div>
      </>
    )
  }
  return project  ? (
    <div className='flex flex-col h-screen w-full bg-gray-950 text-white p-1.5'>

      {/* Builder Navbar */}
      <div className='flex max-sm:flex-col sm:items-center gap-4 px-p py-2 no-scrollbar'>

        {/* left */}
        <div className='flex items-center gap-2 sm:min-w-90 text-nowrap'>

          <img src="/favicon.svg" alt="Logo" className='h-6 cursor-pointer' onClick={()=>navigate("/")}/>

          <div className='max-w-64 sm:max-w-s'>
            <p className='text-sm capitalize truncate text-medium'>
              {project.name}
            </p>
            <p className='text-xs text-gray-400 -mt-0.5'>Previewing last saved version</p>
          </div>

          <div className='sm:hidden flex-1 flex justify-end'>

            {isMenuOpen ? <MessageSquareIcon className='size-6 cursor-pointer' onClick={()=>setIsMenuOpen(false)}/> 
            : <XIcon className='size-6 cursor-pointer' onClick={()=>setIsMenuOpen(true)}/>
            }
          </div>
        </div>

        {/* Middle */}
        <div className='hidden sm:flex gap-2 bg-black p-1.5 rounded-md'>
            <SmartphoneIcon onClick={()=>setDevice("phone")} className={`size-6 p-1 rounded cursor-pointer ${device === "phone" ? "bg-gray-700" : ""}`} />
            <TabletIcon onClick={()=>setDevice("tablet")} className={`size-6 p-1 rounded cursor-pointer ${device === "tablet" ? "bg-gray-700" : ""}`} />
            <LaptopIcon onClick={()=>setDevice("desktop")} className={`size-6 p-1 rounded cursor-pointer ${device === "desktop" ? "bg-gray-700" : ""}`} />
        </div>
        {/* Right */}
        <div className=' flex items-center justify-end gap-3 flex-1 text-xs sm:text-sm'>
          <button disabled={isSaving}
            onClick={saveProject}
            className='max-sm:hidden bg-gray-800 hover:bg-gray-700 text-white px-3.5 py-1 flex items-center gap-2 rounded sm:rounded-sm transition-colors border border-gray-700'
            >
            {isSaving ? <Loader2Icon className='animate-spin' size={16}/> :<SaveIcon size={16}/>}
             Save

          </button>
          <Link target='_blank' to={`/preview/${project.id}`}
            className="flex items-center gap-2 px-4 py-1 rounded sm:rounded-sm border border-gray-700 hover:border-gray-500 transition-colors"
            >
            <FullscreenIcon size={16}/> Perview
          </Link>
          <button
            onClick={downloadCode}
            className='bg-linear-to-br from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 text-white px-3.5 py-1 flex items-center gap-2 rounded sm:rounded-sm transition-colors'
            >
            <ArrowBigDownDash size={16}/> Download
          </button>
          <button
            onClick={togglePublish}
            className='bg-linear-to-br from-indigo-700 to-indigo-600 hover:from-indigo-600 hover: to-indigo-500 text-white px-3.5 py-1 flex items-center gap-2 rounded sm: rounded-sm transition-colors'
            >
            {project.isPublished ? <EyeOffIcon size={16} /> : <EyeIcon size={16}/>} 
            {project.isPublished ? "Unpublish" : "Publish"}
          </button>
        </div>

      </div>

      {/* Side bar And Project Bar */}

      <div className='flex flex-1 overflow-auto'>
        {/* Sidebar */}
        <Sidebar 
        isMenuOpen={isMenuOpen} 
        project={project} 
        setProject={(p)=>setProject(p)} 
        isGenerating={isGenerating} 
        setIsGenerating={setIsGenerating} />

        {/* Project preview */}
        <div className='flex-1 p-2 pl-0'>
          <ProjectPreview 
          ref={previewRef}
          project={project}
          isGenerating={isGenerating}
          device={device}
          />
        </div>
      </div>
       
    </div>
  )
  : 
  (
    <div className='flex items-center justify-center h-screen'>
      <p className='text-2xl font-medium text-gray-200'>Unable to load project</p>
    </div>
  )
}

export default Projects