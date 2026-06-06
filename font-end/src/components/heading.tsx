import React from "react"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "./ui/breadcrumb"
import {Link, useLocation} from "react-router-dom"
import { HiHome, HiChevronRight } from "react-icons/hi2"

interface PageHeadingProps{
    breadcrumb: {
        title: string,
        route: string
    }
}

const PageHeading: React.FC<PageHeadingProps> = ({breadcrumb}) => {
    const location = useLocation()
    const isDashboard = location.pathname === '/dashboard'
    
    return (
        <>
            <div className="page_heading py-3 bg-gradient-to-br from-white via-gray-50/30 to-white dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-900 border-b border-gray-200/60 dark:border-slate-700/60 shadow-sm">
                <div className="page-heading-content">
                    {/* Breadcrumb Navigation - Top Left - Sát lề */}
                    <div className="mb-2">
                        <Breadcrumb>
                            <BreadcrumbList className="flex items-center gap-1.5">
                                <BreadcrumbItem>
                                    <BreadcrumbLink asChild>
                                        <Link 
                                            to="/dashboard" 
                                            className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-blue-600 transition-all duration-200 group"
                                        >
                                            <HiHome className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                                            <span className="hover:underline">Dashboard</span>
                                        </Link>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                
                                {!isDashboard && (
                                    <>
                                        <BreadcrumbSeparator className="text-gray-300">
                                            <HiChevronRight className="w-3 h-3" />
                                        </BreadcrumbSeparator>
                                        <BreadcrumbItem>
                                            <BreadcrumbPage className="text-xs font-medium text-gray-600">
                                                {breadcrumb.title}
                                            </BreadcrumbPage>
                                        </BreadcrumbItem>
                                    </>
                                )}
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                    
                    {/* Page Title - Below with accent */}
                    <div className="flex items-center gap-3">
                        {/* Gradient accent bar */}
                        <div className="relative">
                            <div className="h-8 w-1 bg-gradient-to-b from-blue-500 via-purple-500 to-blue-600 rounded-full shadow-md shadow-blue-500/20"></div>
                        </div>
                        
                        {/* Title with gradient */}
                        <h1 className="text-2xl font-bold tracking-tight">
                            <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                                {breadcrumb.title}
                            </span>
                        </h1>
                    </div>
                </div>
            </div>
        </>
    )
}
export default PageHeading