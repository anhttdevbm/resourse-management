import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { toast } from "react-toastify";
import PageHeading from "../components/heading";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { getUserSettings, patchUserSettings } from "../services/UserService";
import type { UserAppSettings } from "../types/User";
import { applyTheme } from "../utils/applyTheme";
import { useI18n } from "../i18n/I18nProvider";
import type { Locale } from "../i18n/translations";
import {
    FaCog,
    FaPalette,
    FaGlobe,
    FaTable,
    FaBell,
    FaUser,
    FaKey,
    FaEdit,
    FaUndo,
    FaSave,
} from "react-icons/fa";

const DEFAULTS: UserAppSettings = {
    theme: "light",
    locale: "vi",
    dense_ui: false,
    default_page_size: 20,
    show_dashboard_tips: true,
    notify_resource_updates: true,
};

/** Select / number input: nền sáng mặc định, dark mode nền tối + chữ sáng */
const formControlClass =
    "rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-black dark:text-slate-50 dark:focus:border-blue-400 dark:focus:ring-blue-400/25";

type LayoutOutletContext = { setLocale?: (next: Locale) => void };

const ProfileSettings = () => {
    const navigate = useNavigate();
    const { t, setLocale } = useI18n();
    const outlet = useOutletContext<LayoutOutletContext>();
    const applyLocale = (next: Locale) => {
        setLocale(next);
        outlet?.setLocale?.(next);
    };
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState<UserAppSettings>(DEFAULTS);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getUserSettings();
            if (data) {
                const merged = { ...DEFAULTS, ...data };
                setForm(merged);
                applyTheme(merged.theme);
                applyLocale(merged.locale);
            } else toast.error(t("settings.toast.loadFailed"));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const setField = <K extends keyof UserAppSettings>(key: K, value: UserAppSettings[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const updated = await patchUserSettings({
                theme: form.theme,
                locale: form.locale,
                dense_ui: form.dense_ui,
                default_page_size: form.default_page_size,
                show_dashboard_tips: form.show_dashboard_tips,
                notify_resource_updates: form.notify_resource_updates,
            });
            if (updated) {
                const merged = { ...DEFAULTS, ...updated };
                setForm(merged);
                applyTheme(merged.theme);
                applyLocale(merged.locale);
                toast.success(t("settings.toast.saved"));
            } else {
                toast.error(t("settings.toast.saveFailed"));
            }
        } finally {
            setSaving(false);
        }
    };

    const handleReset = async () => {
        setSaving(true);
        try {
            const updated = await patchUserSettings(DEFAULTS);
            if (updated) {
                const merged = { ...DEFAULTS, ...updated };
                setForm(merged);
                applyTheme(merged.theme);
                applyLocale(merged.locale);
                toast.success(t("settings.toast.resetOk"));
            } else {
                toast.error(t("settings.toast.resetFailed"));
            }
        } finally {
            setSaving(false);
        }
    };

    const ToggleRow = ({
        label,
        description,
        checked,
        onChange,
        disabled,
    }: {
        label: string;
        description: string;
        checked: boolean;
        onChange: (v: boolean) => void;
        disabled?: boolean;
    }) => (
        <div className="flex flex-col gap-2 border-b border-gray-100 py-4 last:border-0 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 pr-4">
                <p className="text-sm font-medium text-gray-900 dark:text-slate-100">{label}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 leading-relaxed">{description}</p>
            </div>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                disabled={disabled}
                onClick={() => onChange(!checked)}
                className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 ${
                    checked ? "bg-blue-600" : "bg-gray-300"
                }`}
            >
                <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                        checked ? "translate-x-6" : "translate-x-1"
                    }`}
                />
            </button>
        </div>
    );

    return (
        <>
            <PageHeading breadcrumb={{ title: "Cài đặt", route: "/profile/settings" }} />
            <div className="container mx-auto px-4 py-6">
                <div className="mx-auto max-w-4xl space-y-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                                <FaCog className="text-blue-600" />
                                {t("settings.generalTitle")}
                            </h2>
                            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400 leading-relaxed max-w-2xl">
                                {t("settings.generalDesc")}
                            </p>
                        </div>
                        <div className="grid w-full shrink-0 grid-cols-1 gap-2 sm:max-w-md sm:grid-cols-3 sm:gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                className="border-gray-200 dark:border-slate-600"
                                onClick={() => navigate("/profile")}
                            >
                                <FaUser className="mr-2 h-4 w-4" />
                                {t("settings.nav.profile")}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                className="border-gray-200 dark:border-slate-600"
                                onClick={() => navigate("/profile/edit")}
                            >
                                <FaEdit className="mr-2 h-4 w-4" />
                                {t("settings.nav.editProfile")}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                className="border-gray-200 dark:border-slate-600"
                                onClick={() => navigate("/profile/password")}
                            >
                                <FaKey className="mr-2 h-4 w-4" />
                                {t("settings.nav.password")}
                            </Button>
                        </div>
                    </div>

                    {loading ? (
                        <Card>
                            <CardContent className="py-16 text-center text-sm text-gray-500 dark:text-slate-400">
                                {t("settings.loading")}
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <FaPalette className="text-violet-600" />
                                        {t("settings.ui.title")}
                                    </CardTitle>
                                    <CardDescription>{t("settings.ui.desc")}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-200">
                                            Theme
                                        </label>
                                        <select
                                            value={form.theme}
                                            onChange={(e) =>
                                                setField("theme", e.target.value as UserAppSettings["theme"])
                                            }
                                            className={`w-full max-w-md ${formControlClass}`}
                                        >
                                            <option value="light">{t("settings.ui.theme.light")}</option>
                                            <option value="dark">{t("settings.ui.theme.dark")}</option>
                                            <option value="system">{t("settings.ui.theme.system")}</option>
                                        </select>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <FaGlobe className="text-emerald-600" />
                                        {t("settings.lang.title")}
                                    </CardTitle>
                                    <CardDescription>{t("settings.lang.desc")}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-200">
                                        {t("settings.lang.label")}
                                    </label>
                                    <select
                                        value={form.locale}
                                        onChange={(e) => {
                                            const next = e.target.value as UserAppSettings["locale"];
                                            setField("locale", next);
                                            applyLocale(next);
                                        }}
                                        className={`w-full max-w-md ${formControlClass}`}
                                    >
                                        <option value="vi">Tiếng Việt</option>
                                        <option value="en">English</option>
                                    </select>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <FaTable className="text-amber-600" />
                                        {t("settings.table.title")}
                                    </CardTitle>
                                    <CardDescription>{t("settings.table.desc")}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ToggleRow
                                        label={t("settings.table.dense.label")}
                                        description={t("settings.table.dense.desc")}
                                        checked={form.dense_ui}
                                        onChange={(v) => setField("dense_ui", v)}
                                    />
                                    <div className="pt-2">
                                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-200">
                                            {t("settings.table.pageSize.label")}
                                        </label>
                                        <input
                                            type="number"
                                            min={10}
                                            max={100}
                                            value={form.default_page_size}
                                            onChange={(e) =>
                                                setField(
                                                    "default_page_size",
                                                    Math.min(100, Math.max(10, Number(e.target.value) || 20))
                                                )
                                            }
                                            className={`w-full max-w-xs ${formControlClass}`}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <FaBell className="text-sky-600" />
                                        {t("settings.help.title")}
                                    </CardTitle>
                                    <CardDescription>{t("settings.help.desc")}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ToggleRow
                                        label={t("settings.help.dashboardTips.label")}
                                        description={t("settings.help.dashboardTips.desc")}
                                        checked={form.show_dashboard_tips}
                                        onChange={(v) => setField("show_dashboard_tips", v)}
                                    />
                                    <ToggleRow
                                        label={t("settings.help.notifyUpdates.label")}
                                        description={t("settings.help.notifyUpdates.desc")}
                                        checked={form.notify_resource_updates}
                                        onChange={(v) => setField("notify_resource_updates", v)}
                                    />
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
                                    <p className="text-xs text-gray-500 dark:text-slate-400">
                                        {t("settings.footer.note")}{" "}
                                        <Link
                                            to="/notifications"
                                            className="text-blue-600 dark:text-blue-400 hover:underline"
                                        >
                                            {t("settings.footer.notificationsLink")}
                                        </Link>
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleReset}
                                            disabled={saving}
                                            className="border-gray-300"
                                        >
                                            <FaUndo className="mr-2 h-4 w-4" />
                                            {t("settings.actions.reset")}
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={handleSave}
                                            disabled={saving}
                                            className="bg-blue-600 hover:bg-blue-700 text-white"
                                        >
                                            <FaSave className="mr-2 h-4 w-4" />
                                            {saving ? t("settings.actions.saving") : t("settings.actions.save")}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

export default ProfileSettings;
