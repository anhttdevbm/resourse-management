import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { changePassword } from "../services/UserService";
import PageHeading from "../components/heading";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { 
    FaLock, 
    FaEye, 
    FaEyeSlash, 
    FaCheckCircle, 
    FaExclamationTriangle,
    FaShieldAlt,
    FaKey
} from "react-icons/fa";
import { HiOutlineLockClosed } from "react-icons/hi2";

const ChangePassword = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [showPasswords, setShowPasswords] = useState({
        old: false,
        new: false,
        confirm: false,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [passwordStrength, setPasswordStrength] = useState({
        score: 0,
        feedback: "",
    });

    // Validate password strength
    const checkPasswordStrength = (password: string) => {
        let score = 0;
        let feedback = [];

        if (password.length >= 8) score += 1;
        else feedback.push("Ít nhất 8 ký tự");

        if (/[a-z]/.test(password)) score += 1;
        else feedback.push("Có chữ thường");

        if (/[A-Z]/.test(password)) score += 1;
        else feedback.push("Có chữ hoa");

        if (/[0-9]/.test(password)) score += 1;
        else feedback.push("Có số");

        if (/[^a-zA-Z0-9]/.test(password)) score += 1;
        else feedback.push("Có ký tự đặc biệt");

        return {
            score,
            feedback: feedback.length > 0 ? feedback.join(", ") : "Mật khẩu mạnh",
        };
    };

    const handlePasswordChange = (field: string, value: string) => {
        setFormData({ ...formData, [field]: value });
        
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors({ ...errors, [field]: "" });
        }

        // Check password strength for new password
        if (field === "newPassword") {
            const strength = checkPasswordStrength(value);
            setPasswordStrength(strength);
        }
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.oldPassword || formData.oldPassword.trim().length === 0) {
            newErrors.oldPassword = "Vui lòng nhập mật khẩu hiện tại";
        }

        if (!formData.newPassword || formData.newPassword.trim().length === 0) {
            newErrors.newPassword = "Vui lòng nhập mật khẩu mới";
        } else if (formData.newPassword.length < 6) {
            newErrors.newPassword = "Mật khẩu mới phải có ít nhất 6 ký tự";
        } else if (formData.oldPassword === formData.newPassword) {
            newErrors.newPassword = "Mật khẩu mới phải khác mật khẩu cũ";
        }

        if (!formData.confirmPassword || formData.confirmPassword.trim().length === 0) {
            newErrors.confirmPassword = "Vui lòng xác nhận mật khẩu mới";
        } else if (formData.newPassword !== formData.confirmPassword) {
            newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validate()) {
            return;
        }

        setLoading(true);
        try {
            const success = await changePassword(formData.oldPassword, formData.newPassword);
            
            if (success) {
                toast.success("Đổi mật khẩu thành công!");
                // Reset form
                setFormData({
                    oldPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                });
                setPasswordStrength({ score: 0, feedback: "" });
                // Navigate back to profile after 1 second
                setTimeout(() => {
                    navigate("/profile");
                }, 1000);
            } else {
                toast.error("Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu hiện tại.");
            }
        } catch (error: any) {
            console.error("Change password error:", error);
            const errorMessage = error.response?.data?.detail || "Có lỗi xảy ra khi đổi mật khẩu";
            
            if (errorMessage.includes("INCORRECT_PASSWORD") || errorMessage.includes("Mật khẩu")) {
                setErrors({ oldPassword: "Mật khẩu hiện tại không đúng" });
            }
            
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const getPasswordStrengthColor = () => {
        if (passwordStrength.score === 0) return "bg-gray-200";
        if (passwordStrength.score <= 2) return "bg-red-500";
        if (passwordStrength.score <= 3) return "bg-yellow-500";
        return "bg-green-500";
    };

    const getPasswordStrengthText = () => {
        if (passwordStrength.score === 0) return "Chưa đánh giá";
        if (passwordStrength.score <= 2) return "Yếu";
        if (passwordStrength.score <= 3) return "Trung bình";
        return "Mạnh";
    };

    const breadcrumb = {
        title: "Đổi mật khẩu",
        route: "/profile/password"
    };

    return (
        <>
            <PageHeading breadcrumb={breadcrumb} />
            <div className="container mx-auto px-4 py-6">
                <div className="max-w-2xl mx-auto">
                    {/* Security Info Card */}
                    <Card className="mb-6 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                        <CardContent className="pt-6">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-blue-100 rounded-full">
                                    <FaShieldAlt className="w-6 h-6 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                        Bảo mật tài khoản
                                    </h3>
                                    <p className="text-sm text-gray-600 mb-2">
                                        Để bảo vệ tài khoản của bạn, hãy sử dụng mật khẩu mạnh và không chia sẻ với người khác.
                                    </p>
                                    <ul className="text-xs text-gray-500 space-y-1">
                                        <li>• Mật khẩu nên có ít nhất 8 ký tự</li>
                                        <li>• Kết hợp chữ hoa, chữ thường, số và ký tự đặc biệt</li>
                                        <li>• Không sử dụng thông tin cá nhân dễ đoán</li>
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Change Password Form */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-2xl flex items-center gap-2">
                                <FaKey className="text-blue-600" />
                                Đổi mật khẩu
                            </CardTitle>
                            <CardDescription>
                                Nhập mật khẩu hiện tại và mật khẩu mới để thay đổi
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Old Password Field */}
                                <div>
                                    <label 
                                        htmlFor="oldPassword" 
                                        className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"
                                    >
                                        <HiOutlineLockClosed className="w-4 h-4 text-gray-500" />
                                        Mật khẩu hiện tại
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPasswords.old ? "text" : "password"}
                                            id="oldPassword"
                                            value={formData.oldPassword}
                                            onChange={(e) => handlePasswordChange("oldPassword", e.target.value)}
                                            className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                                                errors.oldPassword 
                                                    ? "border-red-500 focus:ring-red-500" 
                                                    : "border-gray-300"
                                            }`}
                                            placeholder="Nhập mật khẩu hiện tại"
                                            disabled={loading}
                                        />
                                        <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords({ ...showPasswords, old: !showPasswords.old })}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPasswords.old ? (
                                                <FaEyeSlash className="w-5 h-5" />
                                            ) : (
                                                <FaEye className="w-5 h-5" />
                                            )}
                                        </button>
                                    </div>
                                    {errors.oldPassword && (
                                        <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                                            <FaExclamationTriangle className="w-3 h-3" />
                                            {errors.oldPassword}
                                        </p>
                                    )}
                                </div>

                                {/* New Password Field */}
                                <div>
                                    <label 
                                        htmlFor="newPassword" 
                                        className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"
                                    >
                                        <HiOutlineLockClosed className="w-4 h-4 text-gray-500" />
                                        Mật khẩu mới
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPasswords.new ? "text" : "password"}
                                            id="newPassword"
                                            value={formData.newPassword}
                                            onChange={(e) => handlePasswordChange("newPassword", e.target.value)}
                                            className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                                                errors.newPassword 
                                                    ? "border-red-500 focus:ring-red-500" 
                                                    : "border-gray-300"
                                            }`}
                                            placeholder="Nhập mật khẩu mới"
                                            disabled={loading}
                                        />
                                        <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPasswords.new ? (
                                                <FaEyeSlash className="w-5 h-5" />
                                            ) : (
                                                <FaEye className="w-5 h-5" />
                                            )}
                                        </button>
                                    </div>
                                    
                                    {/* Password Strength Indicator */}
                                    {formData.newPassword && (
                                        <div className="mt-2">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs text-gray-600">Độ mạnh mật khẩu:</span>
                                                <span className={`text-xs font-semibold ${
                                                    passwordStrength.score <= 2 ? "text-red-600" :
                                                    passwordStrength.score <= 3 ? "text-yellow-600" :
                                                    "text-green-600"
                                                }`}>
                                                    {getPasswordStrengthText()}
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div 
                                                    className={`h-2 rounded-full transition-all ${getPasswordStrengthColor()}`}
                                                    style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                                                ></div>
                                            </div>
                                            {passwordStrength.feedback && passwordStrength.score < 5 && (
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Gợi ý: {passwordStrength.feedback}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                    
                                    {errors.newPassword && (
                                        <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                                            <FaExclamationTriangle className="w-3 h-3" />
                                            {errors.newPassword}
                                        </p>
                                    )}
                                </div>

                                {/* Confirm Password Field */}
                                <div>
                                    <label 
                                        htmlFor="confirmPassword" 
                                        className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"
                                    >
                                        <HiOutlineLockClosed className="w-4 h-4 text-gray-500" />
                                        Xác nhận mật khẩu mới
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPasswords.confirm ? "text" : "password"}
                                            id="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={(e) => handlePasswordChange("confirmPassword", e.target.value)}
                                            className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                                                errors.confirmPassword 
                                                    ? "border-red-500 focus:ring-red-500" 
                                                    : formData.newPassword === formData.confirmPassword && formData.confirmPassword
                                                    ? "border-green-500 focus:ring-green-500"
                                                    : "border-gray-300"
                                            }`}
                                            placeholder="Nhập lại mật khẩu mới"
                                            disabled={loading}
                                        />
                                        <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPasswords.confirm ? (
                                                <FaEyeSlash className="w-5 h-5" />
                                            ) : (
                                                <FaEye className="w-5 h-5" />
                                            )}
                                        </button>
                                    </div>
                                    {errors.confirmPassword && (
                                        <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                                            <FaExclamationTriangle className="w-3 h-3" />
                                            {errors.confirmPassword}
                                        </p>
                                    )}
                                    {!errors.confirmPassword && formData.confirmPassword && formData.newPassword === formData.confirmPassword && (
                                        <p className="mt-1 text-sm text-green-600 flex items-center gap-1">
                                            <FaCheckCircle className="w-4 h-4" />
                                            Mật khẩu khớp
                                        </p>
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
                                                Đổi mật khẩu
                                            </span>
                                        )}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => navigate("/profile")}
                                        className="px-6"
                                        disabled={loading}
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

export default ChangePassword;

