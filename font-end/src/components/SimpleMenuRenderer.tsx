import React from 'react';
import { useLocation } from 'react-router-dom';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "../components/ui/accordion";
import { Link } from "react-router-dom";
import '../assets/scss/Accordion.scss';
import '../assets/scss/Aside.scss';
import { userMenuItems, adminMenuItems } from "../constant/role-based-menu";
import { useAuth } from "../contexts/AuthContext";

interface SimpleMenuRendererProps {
  className?: string;
}

const SimpleMenuRenderer: React.FC<SimpleMenuRendererProps> = ({ className = "" }) => {
    const location = useLocation();
    const pathname = location.pathname;
    const { isAdmin, hasPermission: checkPermission } = useAuth();

    // Chọn menu dựa trên role
    const currentMenuItems = isAdmin ? [...userMenuItems, ...adminMenuItems] : userMenuItems;

    const getOpenAccordionValue = () => {
        for (let groupIndex = 0; groupIndex < currentMenuItems.length; groupIndex++) {
            const group = currentMenuItems[groupIndex];
            for (let itemIndex = 0; itemIndex < group.items.length; itemIndex++) {
                const item = group.items[itemIndex];
                if (item.links.some(link => pathname.startsWith(link.to))) {
                    return `item-${groupIndex}-${itemIndex}`;
                }
            }
        }
        return '';
    };

    const defaultValue = getOpenAccordionValue();

    // Kiểm tra quyền hiển thị menu item
    const canShowMenuItem = (item: any) => {
        if (!item.permission) return true; // Menu không cần permission
        return checkPermission(item.permission);
    };

    return (
        <div className={`${className}`}>
            {/* Main Menu Items */}
            {currentMenuItems.map((group, groupIndex) => (
                <div key={group.label}>
                    <div className="menu-category px-6 py-2 text-gray-400 text-xs tracking-wider font-semibold mt-2 uppercase opacity-50">
                        {group.label}
                    </div>

                    <Accordion
                        type="single"
                        collapsible
                        className="px-3 sidebar-accordion"
                        defaultValue={defaultValue}
                    >
                        {group.items.map((item, itemIndex) => {
                            // Chỉ hiển thị menu item nếu user có quyền
                            if (!canShowMenuItem(item)) return null;

                            const accordionValue = `item-${groupIndex}-${itemIndex}`;
                            const isActive = item.active.some(activePath => 
                                pathname.startsWith(activePath)
                            );

                            return (
                                <AccordionItem
                                    key={itemIndex}
                                    value={accordionValue}
                                >
                                    <AccordionTrigger
                                        className={`rounded-lg px-3 py-2 transition-all duration-200 flex items-center
                                            text-gray-300 hover:bg-[#1e2a5a] hover:text-white`}
                                    >
                                        <div className="flex items-center gap-2">
                                            {item.icon}
                                            <span>{item.label}</span>
                                        </div>
                                    </AccordionTrigger>

                                    <AccordionContent>
                                        <ul>
                                            {item.links.map((link, linkIndex) => {
                                                const isLinkActive = pathname === link.to;

                                                return (
                                                    <li key={linkIndex}>
                                                        <Link
                                                            to={link.to}
                                                            className={`block rounded-lg py-1.5 px-4 transition-all duration-200 no-underline w-full
                                                                ${isLinkActive
                                                                    ? 'bg-[#1e2a5a] text-white font-medium'
                                                                    : 'text-gray-400 hover:text-white hover:bg-[#1e2a5a]'}
                                                            `}
                                                            style={{ paddingLeft: '2.5rem' }}
                                                        >
                                                            {link.title}
                                                        </Link>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </AccordionContent>
                                </AccordionItem>
                            );
                        })}
                    </Accordion>
                </div>
            ))}
        </div>
    );
};

export default SimpleMenuRenderer;
