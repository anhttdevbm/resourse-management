import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import PageHeading from "../components/heading";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { FaUser, FaEnvelope, FaEdit, FaKey, FaCog } from "react-icons/fa";
import { cookieStorage } from "../utils/cookie";
import { getApiOrigin } from "../configs/axios";

const Profile = () => {
    const navigate = useNavigate();
    const { user: currentUser } = useSelector((state: RootState) => state.auth);
    const [avatarKey, setAvatarKey] = useState(0);

    // Helper function to build avatar URL
    const getAvatarUrl = (avatarUrl: string | null | undefined): string | undefined => {
        if (!avatarUrl) return undefined;
        if (avatarUrl.startsWith('http')) {
            return `${avatarUrl}?t=${Date.now()}`;
        }
        const token = cookieStorage.getItem("accessToken");
        const apiUrl = getApiOrigin();
        return token 
            ? `${apiUrl}/resource-management/users/me/avatar?token=${encodeURIComponent(token)}&t=${Date.now()}`
            : undefined;
    };

    // Force re-render avatar when user changes
    useEffect(() => {
        setAvatarKey((prev: number) => prev + 1);
    }, [currentUser?.avatar_url]);

    const userInitials = currentUser?.name
        ? currentUser.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)
        : "U";

    return (
        <>
            <PageHeading breadcrumb={{ title: 'Hồ sơ cá nhân', route: '/profile' }} />
            <div className="container mx-auto px-4 py-6">
                <div className="max-w-4xl mx-auto">
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FaUser className="text-blue-600" />
                                Thông tin cá nhân
                            </CardTitle>
                            <CardDescription>
                                Xem và quản lý thông tin tài khoản của bạn
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col items-center justify-center py-6">
                                <Avatar className="w-32 h-32 mb-4 border-4 border-blue-100" key={avatarKey}>
                                    <AvatarImage src={getAvatarUrl(currentUser?.avatar_url)} />
                                    <AvatarFallback className="text-3xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                                        {userInitials}
                                    </AvatarFallback>
                                </Avatar>
                                
                                <h2 className="text-2xl font-bold text-gray-800 mb-1">
                                    {currentUser?.name || "Người dùng"}
                                </h2>
                                <p className="text-gray-600 mb-6 flex items-center gap-2">
                                    <FaEnvelope className="text-sm" />
                                    {currentUser?.email || "N/A"}
                                </p>

                                <div className="flex flex-wrap gap-3 justify-center">
                                    <Button
                                        onClick={() => navigate("/profile/edit")}
                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                        <FaEdit className="mr-2" />
                                        Chỉnh sửa hồ sơ
                                    </Button>
                                    <Button
                                        onClick={() => navigate("/profile/password")}
                                        variant="outline"
                                        className="border-blue-600 text-blue-600 hover:bg-blue-50"
                                    >
                                        <FaKey className="mr-2" />
                                        Đổi mật khẩu
                                    </Button>
                                    <Button
                                        onClick={() => navigate("/profile/settings")}
                                        variant="outline"
                                        className="border-gray-300 text-gray-700 hover:bg-gray-50"
                                    >
                                        <FaCog className="mr-2" />
                                        Cài đặt
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Thông tin chi tiết</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between py-2 border-b">
                                    <span className="text-gray-600 font-medium">ID:</span>
                                    <span className="text-gray-800">{currentUser?.id || "N/A"}</span>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b">
                                    <span className="text-gray-600 font-medium">Email:</span>
                                    <span className="text-gray-800">{currentUser?.email || "N/A"}</span>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b">
                                    <span className="text-gray-600 font-medium">Tên:</span>
                                    <span className="text-gray-800">{currentUser?.name || "N/A"}</span>
                                </div>
                                {currentUser?.permissions && currentUser.permissions.length > 0 && (
                                    <div className="flex items-center justify-between py-2">
                                        <span className="text-gray-600 font-medium">Quyền:</span>
                                        <div className="flex flex-wrap gap-2">
                                            {currentUser.permissions.map((permission, index) => (
                                                <span
                                                    key={index}
                                                    className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                                                >
                                                    {permission}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
};

export default Profile;

