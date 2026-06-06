import MenuRenderer from "./MenuRenderer";
import '../assets/scss/Aside.scss';

interface AsideProps {
    isOpen: boolean;
}

const Aside: React.FC<AsideProps> = ({ isOpen }) => {
    return (
        <aside className={`app-aside bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 h-full fixed w-64 text-sm top-0 left-0 transition-transform duration-300 ease-in-out z-50 shadow-2xl ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
            {/* Logo Section */}
            <div className="flex items-center justify-start px-6 py-5 border-b border-slate-700/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                        </svg>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-white font-bold text-base leading-tight">Resource</span>
                        <span className="text-slate-400 text-xs font-medium">Management</span>
                    </div>
                </div>
            </div>

            {/* Menu Content */}
            <div className="h-[calc(100vh-80px)]">
                <MenuRenderer />
            </div>
        </aside>
    );
};

export default Aside;