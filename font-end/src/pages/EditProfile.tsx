import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { getCurrentUser, updateCurrentUser, uploadAvatar } from "../services/UserService";
import { UserUpdatePayload } from "../types/User";
import { RootState } from "../redux/store";
import { setAuthLogin } from "../redux/slice/authSlice";
import PageHeading from "../components/heading";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { FaUser, FaEnvelope, FaLock, FaCheckCircle, FaCamera } from "react-icons/fa";
import { HiOutlineUser, HiOutlineLockClosed } from "react-icons/hi2";
import { MdEmail } from "react-icons/md";
import { cookieStorage } from "../utils/cookie";
import { getApiOrigin } from "../configs/axios";

const EditProfile = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user: currentUser } = useSelector((state: RootState) => state.auth);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<UserUpdatePayload>({
        name: "",
        email: "",
        password: "",
    });
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [avatarKey, setAvatarKey] = useState(0); // Force re-render avatar

    useEffect(() => {
        const loadUserData = async () => {
            if (currentUser) {
                setFormData({
                    name: currentUser.name || "",
                    email: currentUser.email || "",
                    password: "",
                });
                if (currentUser.avatar_url) {
                    if (currentUser.avatar_url.startsWith('http')) {
                        setAvatarPreview(currentUser.avatar_url);
                    } else {
                        const token = cookieStorage.getItem("accessToken");
                        const apiUrl = getApiOrigin();
                        const avatarUrl = token 
                            ? `${apiUrl}/resource-management/users/me/avatar?token=${encodeURIComponent(token)}&t=${Date.now()}`
                            : null;
                        setAvatarPreview(avatarUrl);
                    }
                    setAvatarKey(prev => prev + 1); // Force re-render
                }
            } else {
                const userData = await getCurrentUser();
                if (userData) {
                    setFormData({
                        name: userData.name || "",
                        email: userData.email || "",
                        password: "",
                    });
                    if (userData.avatar_url) {
                        if (userData.avatar_url.startsWith('http')) {
                            setAvatarPreview(userData.avatar_url);
                        } else {
                            const token = cookieStorage.getItem("accessToken");
                            const apiUrl = getApiOrigin();
                            const avatarUrl = token 
                                ? `${apiUrl}/resource-management/users/me/avatar?token=${encodeURIComponent(token)}&t=${Date.now()}`
                                : null;
                            setAvatarPreview(avatarUrl);
                        }
                        setAvatarKey(prev => prev + 1); // Force re-render
                    }
                }
            }
        };
        loadUserData();
    }, [currentUser]);

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name || formData.name.trim().length === 0) {
            newErrors.name = "Tên không được để trống";
        }

        if (!formData.email || formData.email.trim().length === 0) {
            newErrors.email = "Email không được để trống";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Email không hợp lệ";
        }

        if (formData.password) {
            if (formData.password.length < 6) {
                newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
            } else if (formData.password !== confirmPassword) {
                newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error("Vui lòng chọn file ảnh");
            return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Kích thước file không được vượt quá 5MB");
            return;
        }

        // Show preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setAvatarPreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Upload avatar
        setUploadingAvatar(true);
        try {
            const updatedUser = await uploadAvatar(file);
            console.log("📸 Upload response:", updatedUser);
            if (updatedUser) {
                // Update Redux state
                dispatch(setAuthLogin(updatedUser));
                
                // Update localStorage to keep it in sync
                cookieStorage.setItem("user", JSON.stringify(updatedUser), { expires: 7 });
                
                toast.success("Cập nhật avatar thành công!");
                
                // Build avatar URL with cache busting
                if (updatedUser.avatar_url) {
                    const token = cookieStorage.getItem("accessToken");
                    const apiUrl = getApiOrigin();
                    // Always add timestamp for cache busting
                    const timestamp = Date.now();
                    const avatarUrl = token 
                        ? `${apiUrl}/resource-management/users/me/avatar?token=${encodeURIComponent(token)}&t=${timestamp}`
                        : null;
                    setAvatarPreview(avatarUrl);
                    setAvatarKey(prev => prev + 1); // Force re-render avatar
                    console.log("📸 Set avatar preview:", avatarUrl);
                    console.log("📸 Avatar URL from response:", updatedUser.avatar_url);
                    console.log("📸 Updated Redux state with user:", updatedUser);
                } else {
                    console.warn("⚠️ No avatar_url in response");
                    setAvatarPreview(null);
                }
            } else {
                toast.error("Cập nhật avatar thất bại!");
                setAvatarPreview(null);
            }
        } catch (error) {
            console.error("Upload avatar error:", error);
            toast.error("Có lỗi xảy ra khi upload avatar!");
            setAvatarPreview(null);
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validate()) {
            return;
        }

        setLoading(true);
        try {
            const payload: UserUpdatePayload = {
                name: formData.name,
                email: formData.email,
            };

            // Chỉ gửi password nếu có thay đổi
            if (formData.password && formData.password.trim().length > 0) {
                payload.password = formData.password;
            }

            const updatedUser = await updateCurrentUser(payload);
            
            if (updatedUser) {
                dispatch(setAuthLogin(updatedUser));
                toast.success("Cập nhật thông tin thành công!");
                navigate("/profile");
            } else {
                toast.error("Cập nhật thông tin thất bại!");
            }
        } catch (error) {
            console.error("Update error:", error);
            toast.error("Có lỗi xảy ra khi cập nhật thông tin!");
        } finally {
            setLoading(false);
        }
    };

    const breadcrumb = {
        title: "Thay đổi thông tin",
        route: "/profile/edit"
    };

    const userInitials = formData.name
        ? formData.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)
        : "U";

    return (
        <>
            <PageHeading breadcrumb={breadcrumb} />
            <div className="container mx-auto px-4 py-6">
                <div className="max-w-4xl mx-auto">
                    {/* Avatar Section */}
                    <Card className="mb-6">
                        <CardContent className="pt-6">
                            <div className="flex flex-col items-center justify-center py-6">
                                <div className="relative group">
                                    <Avatar className="w-32 h-32 mb-4 border-4 border-blue-100 cursor-pointer" key={avatarKey}>
                                        <AvatarImage 
                                            src={
                                                avatarPreview 
                                                    ? (() => {
                                                        if (avatarPreview.startsWith('http') || avatarPreview.startsWith('data:')) {
                                                            return avatarPreview;
                                                        }
                                                        const token = cookieStorage.getItem("accessToken");
                                                        const apiUrl = getApiOrigin();
                                                        return token 
                                                            ? `${apiUrl}/resource-management/users/me/avatar?token=${encodeURIComponent(token)}&t=${Date.now()}`
                                                            : undefined;
                                                    })()
                                                    : undefined
                                            } 
                                        />
                                        <AvatarFallback className="text-3xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                                            {userInitials}
                                        </AvatarFallback>
                                    </Avatar>
                                    <label
                                        htmlFor="avatar-upload"
                                        className={`absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity ${
                                            uploadingAvatar ? "opacity-100" : ""
                                        }`}
                                    >
                                        {uploadingAvatar ? (
                                            <span className="text-white text-sm">Đang tải...</span>
                                        ) : (
                                            <FaCamera className="text-white text-2xl" />
                                        )}
                                    </label>
                                    <input
                                        type="file"
                                        id="avatar-upload"
                                        accept="image/*"
                                        onChange={handleAvatarChange}
                                        className="hidden"
                                        disabled={uploadingAvatar}
                                    />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900">{formData.name || "Người dùng"}</h3>
                                <p className="text-sm text-gray-500">{formData.email || ""}</p>
                                <p className="text-xs text-gray-400 mt-2">Nhấp vào avatar để thay đổi</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Form Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-2xl">Thông tin tài khoản</CardTitle>
                            <CardDescription>
                                Cập nhật thông tin cá nhân và mật khẩu của bạn
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Name Field */}
                                <div>
                                    <label htmlFor="name" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                        <HiOutlineUser className="w-4 h-4 text-gray-500" />
                                        Họ và tên
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            id="name"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                                                errors.name ? "border-red-500 focus:ring-red-500" : "border-gray-300"
                                            }`}
                                            placeholder="Nhập họ và tên"
                                        />
                                        <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    </div>
                                    {errors.name && (
                                        <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                                            <span>⚠</span> {errors.name}
                                        </p>
                                    )}
                                </div>

                                {/* Email Field */}
                                <div>
                                    <label htmlFor="email" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                        <MdEmail className="w-4 h-4 text-gray-500" />
                                        Email
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="email"
                                            id="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                                                errors.email ? "border-red-500 focus:ring-red-500" : "border-gray-300"
                                            }`}
                                            placeholder="Nhập email"
                                        />
                                        <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    </div>
                                    {errors.email && (
                                        <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                                            <span>⚠</span> {errors.email}
                                        </p>
                                    )}
                                </div>

                                {/* Password Section */}
                                <div className="border-t pt-6">
                                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <HiOutlineLockClosed className="w-5 h-5 text-gray-500" />
                                        Thay đổi mật khẩu
                                    </h4>
                                    <p className="text-sm text-gray-500 mb-4">
                                        Để trống nếu bạn không muốn thay đổi mật khẩu
                                    </p>

                                    {/* Password Field */}
                                    <div className="mb-4">
                                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                            Mật khẩu mới
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="password"
                                                id="password"
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                                                    errors.password ? "border-red-500 focus:ring-red-500" : "border-gray-300"
                                                }`}
                                                placeholder="Nhập mật khẩu mới"
                                            />
                                            <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        </div>
                                        {errors.password && (
                                            <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                                                <span>⚠</span> {errors.password}
                                            </p>
                                        )}
                                    </div>

                                    {/* Confirm Password Field */}
                                    {formData.password && (
                                        <div>
                                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                                Xác nhận mật khẩu mới
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="password"
                                                    id="confirmPassword"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                                                        errors.confirmPassword ? "border-red-500 focus:ring-red-500" : "border-gray-300"
                                                    }`}
                                                    placeholder="Nhập lại mật khẩu mới"
                                                />
                                                <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                            </div>
                                            {errors.confirmPassword && (
                                                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                                                    <span>⚠</span> {errors.confirmPassword}
                                                </p>
                                            )}
                                            {!errors.confirmPassword && confirmPassword && formData.password === confirmPassword && (
                                                <p className="mt-1 text-sm text-green-600 flex items-center gap-1">
                                                    <FaCheckCircle className="w-4 h-4" />
                                                    Mật khẩu khớp
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3 pt-4 border-t">
                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                        {loading ? (
                                            <span className="flex items-center gap-2">
                                                <span className="animate-spin">⏳</span>
                                                Đang xử lý...
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-2">
                                                <FaCheckCircle />
                                                Cập nhật thông tin
                                            </span>
                                        )}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => navigate("/profile")}
                                        className="px-6"
                                    >
                                        Hủy
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
};

export default EditProfile;

