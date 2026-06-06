import { Outlet } from "react-router-dom";
import React, { useEffect, useState } from "react"
import { showToast } from "../helpers/myHelper"
import { useSelector, useDispatch } from "react-redux"
import { RootState } from "../redux/store"
import { clearToast } from '../redux/slice/toastSlice';
import Header from "./header";
import Aside  from "./aside";
import '../assets/scss/Style.scss'
import { useNotificationStream } from "../hooks/useNotificationStream"
import { getUserSettings } from "../services/UserService"
import { applyTheme } from "../utils/applyTheme"
import { I18nProvider } from "../i18n/I18nProvider"
import { LocaleSync } from "../i18n/LocaleSync"
import type { Locale } from "../i18n/translations"

const Layout: React.FC = () => {
    const { message, type } = useSelector((state: RootState) => state.toast)
    const dispatch = useDispatch()
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [locale, setLocale] = useState<Locale>("vi");
    useNotificationStream()

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const settings = await getUserSettings();
            if (cancelled) return;
            if (settings?.theme) applyTheme(settings.theme);
            if (settings?.locale) setLocale(settings.locale as Locale);
            document.documentElement.lang = settings?.locale === "en" ? "en" : "vi";
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    // Locale state lives here so initial user settings can drive the app.
    // Pages can still update locale after saving settings via Outlet context if needed.
    const handleLocaleChange = (next: Locale) => {
        setLocale(next);
        document.documentElement.lang = next === "en" ? "en" : "vi";
    };

    useEffect(() => {
        showToast(message, type)
        dispatch(clearToast())
    }, [message, type])
    
    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };
    
    return (
        <I18nProvider initialLocale={locale}>
            <LocaleSync locale={locale} />
            <div className="page">
                <Header onToggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
                <Aside isOpen={isSidebarOpen} />
                <div className={`main-content ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
                    <Outlet context={{ setLocale: handleLocaleChange }} />
                </div>
            </div>
        </I18nProvider>
    )
}
export default Layout