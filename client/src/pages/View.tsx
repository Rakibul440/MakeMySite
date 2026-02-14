import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { dummyProjects } from '../assets/assets';
import { Loader2Icon } from 'lucide-react';
import ProjectPreview from '../components/ProjectPreview';
import type { Project } from '../types';

function View() {

  const {projectId} = useParams();
  const [code,setCode] = useState('')
  const [loading,setLoading] = useState(true)

  const fetchCode = async ()=>{
    const code =dummyProjects.find(project=> project.id === projectId)?.current_code;

    setTimeout(()=>{
      if(code){
        setCode(code);
        setLoading(false)
      }
    },1000)

  }

  useEffect(()=>{
    fetchCode()
  },[])

  if(loading){
    return (
      <div className='flex justify-center items-center h-screen'>
        <Loader2Icon className='size-7 animate-spin text-indigo-200' />
      </div>
    )
  }

  return (
    <div className='flex justify-center items-center h-screen'>
      {code && 
      <ProjectPreview 
        project={{current_code : code} as Project}
        isGenerating={false} 
        showEditorPanel={false}
      />}
    </div>
  )
}

export default View   