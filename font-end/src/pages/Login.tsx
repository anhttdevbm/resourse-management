import { useForm, SubmitHandler } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { login, facebookLogin, twitterLogin, googleLogin, githubLogin, handleFacebookCallback, handleTwitterCallback, handleGoogleCallback, handleGithubCallback, fetchUser } from "../services/AuthService";
import {
    MDBContainer,
    MDBRow,
    MDBCol,
    MDBCard,
    MDBCardBody,
    MDBInput,
    MDBBtn,
    MDBIcon
} from 'mdb-react-ui-kit';
import './setting.scss';
import './Login.scss';
import '@fortawesome/fontawesome-free/css/all.min.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { setToast } from "../redux/slice/toastSlice";
import { useDispatch } from "react-redux";
import { Button } from "../components/ui/button";
import { ReloadIcon } from "@radix-ui/react-icons";
import { useState } from "react";
import { setAuthLogin } from "../redux/slice/authSlice";
import { useEffect } from "react";
import { cookieStorage } from "../utils/cookie";

type Inputs = {
    email: string;
    password: string;
};

const Login = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(false);
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<Inputs>();

    // Handle Facebook callback
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const accessToken = urlParams.get('access_token');
        const refreshToken = urlParams.get('refresh_token');
        const loginType = urlParams.get('login_type');
        const code = urlParams.get('code');
        const codeVerifier = urlParams.get('code_verifier');
        const fromPage = urlParams.get('from');

        if (accessToken && loginType === 'facebook') {
            // Handle Facebook OAuth callback
            cookieStorage.setItem("accessToken", accessToken, { expires: 7 });
            if (refreshToken) {
                cookieStorage.setItem("refreshToken", refreshToken, { expires: 30 });
            }
            handleFacebookSuccess();
        } else if (accessToken && loginType === 'twitter') {
            // Handle Twitter OAuth callback
            cookieStorage.setItem("accessToken", accessToken, { expires: 7 });
            if (refreshToken) {
                cookieStorage.setItem("refreshToken", refreshToken, { expires: 30 });
            }
            handleTwitterSuccess();
        } else if (accessToken && loginType === 'google') {
            // Handle Google OAuth callback
            cookieStorage.setItem("accessToken", accessToken, { expires: 7 });
            if (refreshToken) {
                cookieStorage.setItem("refreshToken", refreshToken, { expires: 30 });
            }
            handleGoogleSuccess();
        } else if (accessToken && loginType === 'github') {
            // Handle GitHub OAuth callback
            cookieStorage.setItem("accessToken", accessToken, { expires: 7 });
            if (refreshToken) {
                cookieStorage.setItem("refreshToken", refreshToken, { expires: 30 });
            }
            handleGithubSuccess();
        } else if (code && !loginType) {
            // Handle Twitter callback without login_type (fallback)
            handleTwitterCallbackFromURL(code, codeVerifier || undefined);
        }
        
        // Handle social login errors
        const error = urlParams.get('error');
        const errorMessage = urlParams.get('message');
        if (error === 'twitter_login_failed') {
            dispatch(setToast({ message: `Đăng nhập Twitter thất bại: ${errorMessage}`, type: "error" }));
        } else if (error === 'account_locked') {
            dispatch(setToast({ message: 'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.', type: "error" }));
        } else if (error === 'google_login_failed') {
            dispatch(setToast({ message: `Đăng nhập Google thất bại: ${errorMessage}`, type: "error" }));
        } else if (error === 'github_login_failed') {
            dispatch(setToast({ message: `Đăng nhập GitHub thất bại: ${errorMessage}`, type: "error" }));
        }
    }, []);

    const handleFacebookLogin = async () => {
        try {
            setLoading(true);
            await facebookLogin();
        } catch (error) {
            console.error('Facebook login error:', error);
            dispatch(setToast({ message: "Đăng nhập Facebook thất bại!", type: "error" }));
        } finally {
            setLoading(false);
        }
    };

    const handleFacebookCallbackFromURL = async (code: string) => {
        try {
            setLoading(true);
            const user = await handleFacebookCallback(code);
            if (user) {
                dispatch(setToast({ message: "Đăng nhập Facebook thành công!", type: "success" }));
                dispatch(setAuthLogin(user));
                navigate("/dashboard");
            } else {
                dispatch(setToast({ message: "Đăng nhập Facebook thất bại!", type: "error" }));
            }
        } catch (error) {
            console.error('Facebook callback error:', error);
            dispatch(setToast({ message: "Có lỗi xảy ra khi đăng nhập Facebook!", type: "error" }));
        } finally {
            setLoading(false);
        }
    };

    const handleFacebookSuccess = async () => {
        try {
            setLoading(true);
            // Fetch user info using the stored token
            const user = await fetchUser();
            if (user) {
                dispatch(setToast({ message: "Đăng nhập Facebook thành công!", type: "success" }));
                dispatch(setAuthLogin(user));
                navigate("/dashboard");
            } else {
                dispatch(setToast({ message: "Không thể lấy thông tin user!", type: "error" }));
            }
        } catch (error) {
            console.error('Facebook success error:', error);
            dispatch(setToast({ message: "Có lỗi xảy ra khi đăng nhập Facebook!", type: "error" }));
        } finally {
            setLoading(false);
        }
    };

    const handleTwitterLogin = async () => {
        try {
            setLoading(true);
            await twitterLogin();
        } catch (error) {
            console.error('Twitter login error:', error);
            dispatch(setToast({ message: "Đăng nhập Twitter thất bại!", type: "error" }));
        } finally {
            setLoading(false);
        }
    };

    const handleTwitterCallbackFromURL = async (code: string, codeVerifier?: string) => {
        try {
            const user = await handleTwitterCallback(code, codeVerifier);
            if (user) {
                dispatch(setToast({ message: "Đăng nhập Twitter thành công!", type: "success" }));
                handleTwitterSuccess();
            } else {
                dispatch(setToast({ message: "Đăng nhập Twitter thất bại!", type: "error" }));
            }
        } catch (error) {
            console.error('Twitter callback error:', error);
            dispatch(setToast({ message: "Có lỗi xảy ra khi đăng nhập Twitter!", type: "error" }));
        }
    };

    const handleTwitterSuccess = async () => {
        try {
            const user = await fetchUser();
            if (user) {
                dispatch(setAuthLogin(user));
                navigate("/dashboard");
            }
        } catch (error) {
            console.error('Twitter success error:', error);
            dispatch(setToast({ message: "Có lỗi xảy ra khi đăng nhập Twitter!", type: "error" }));
        }
    };

    const handleGoogleLogin = async () => {
        try {
            setLoading(true);
            await googleLogin();
        } catch (error) {
            console.error('Google login error:', error);
            dispatch(setToast({ message: "Đăng nhập Google thất bại!", type: "error" }));
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async () => {
        try {
            const user = await fetchUser();
            if (user) {
                dispatch(setAuthLogin(user));
                navigate("/dashboard");
            }
        } catch (error) {
            console.error('Google success error:', error);
            dispatch(setToast({ message: "Có lỗi xảy ra khi đăng nhập Google!", type: "error" }));
        }
    };

    const handleGithubLogin = async () => {
        try {
            setLoading(true);
            await githubLogin();
        } catch (error) {
            console.error('GitHub login error:', error);
            dispatch(setToast({ message: "Đăng nhập GitHub thất bại!", type: "error" }));
        } finally {
            setLoading(false);
        }
    };

    const handleGithubSuccess = async () => {
        try {
            const user = await fetchUser();
            if (user) {
                dispatch(setAuthLogin(user));
                navigate("/dashboard");
            }
        } catch (error) {
            console.error('GitHub success error:', error);
            dispatch(setToast({ message: "Có lỗi xảy ra khi đăng nhập GitHub!", type: "error" }));
        }
    };

    const loginHander: SubmitHandler<Inputs> = async (payload) => {
        setLoading(true);
        try {
            const auth = await login(payload);
            if (auth) {
                const user = await fetchUser();
                dispatch(setToast({ message: "Đăng nhập vào hệ thống thành công!", type: "success" }));
                dispatch(setAuthLogin(user ?? auth));
                navigate("/dashboard");
            } else {
                dispatch(setToast({ message: "Đăng nhập thất bại, vui lòng kiểm tra lại!", type: "error" }));
            }
        } catch (error) {
            console.error("Login error:", error);
            dispatch(setToast({ message: "Có lỗi xảy ra, vui lòng thử lại!", type: "error" }));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className='background-radial-gradient'>
            <MDBContainer fluid className='p-4 login-container'>
                <MDBRow className='login-row'>
                    <MDBCol md='6' className='text-center text-md-start d-flex flex-column justify-content-center pt-20'>
                        <h1 className="my-5 display-3 fw-bold ls-tight px-3" style={{ color: 'hsl(218, 81%, 95%)' }}>
                            Welcome Back! <br />
                            <span style={{ color: 'hsl(218, 81%, 75%)' }}>Please login to your account</span>
                        </h1>
                        <p className='px-3' style={{ color: 'hsl(218, 81%, 85%)' }}>
                            Access your resources quickly and securely with our advanced hosting services.
                        </p>
                    </MDBCol>
                    <MDBCol md='6' className='position-relative'>
                        <div id="radius-shape-1" className="position-absolute rounded-circle shadow-5-strong"></div>
                        <div id="radius-shape-2" className="position-absolute shadow-5-strong"></div>
                        <MDBCard className='my-5 bg-glass'>
                            <MDBCardBody className='p-5'>
                                <form onSubmit={handleSubmit(loginHander)}>
                                    <label htmlFor="email">Email</label>
                                    <MDBInput
                                        wrapperClass='mb-4'
                                        id='email'
                                        type='text'
                                        placeholder="Nhập vào email của bạn"
                                        {...register("email", { required: "Email là bắt buộc" })}
                                    />
                                    {errors.email && (
                                        <p className='text-danger text-sm mt-1'>{errors.email.message}</p>
                                    )}
                                    <label htmlFor="password">Password</label>
                                    <MDBInput
                                        wrapperClass='mb-4'
                                        id='password'
                                        type='password'
                                        placeholder="Nhập vào password của bạn"
                                        {...register("password", { required: "Password là bắt buộc" })}
                                    />
                                    {errors.password && (
                                        <p className='text-danger text-sm mt-1'>{errors.password.message}</p>
                                    )}

                                    <div className='d-flex justify-content-between mb-4'>
                                        <a href="/forgot-password" className='text-primary'>Quên mật khẩu?</a>
                                    </div>

                                    <Button disabled={loading} className="text-xs w-100 mb-4">
                                        {loading ? <ReloadIcon className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        {loading ? 'Đang xử lí' : 'Đăng nhập'}
                                    </Button>
                                </form>

                                <div className='text-center'>
                                    <p>Login with:</p>
                                    <MDBBtn 
                                        tag='button' 
                                        color='none' 
                                        className='mx-3' 
                                        style={{ color: '#1266f1' }}
                                        onClick={handleFacebookLogin}
                                        disabled={loading}
                                    >
                                        <MDBIcon fab icon='facebook-f' size='sm' />
                                    </MDBBtn>

                                    <MDBBtn 
                                        tag='button' 
                                        color='none' 
                                        className='mx-3' 
                                        style={{ color: '#1DA1F2' }}
                                        onClick={handleTwitterLogin}
                                        disabled={loading}
                                    >
                                        <MDBIcon fab icon='twitter' size="sm" />
                                    </MDBBtn>

                                    <MDBBtn 
                                        tag='button' 
                                        color='none' 
                                        className='mx-3' 
                                        style={{ color: '#DB4437' }}
                                        onClick={handleGoogleLogin}
                                        disabled={loading}
                                    >
                                        <MDBIcon fab icon='google' size="sm" />
                                    </MDBBtn>

                                    <MDBBtn 
                                        tag='button' 
                                        color='none' 
                                        className='mx-3' 
                                        style={{ color: '#333' }}
                                        onClick={handleGithubLogin}
                                        disabled={loading}
                                    >
                                        <MDBIcon fab icon='github' size="sm" />
                                    </MDBBtn>
                                </div>
                            </MDBCardBody>
                        </MDBCard>
                    </MDBCol>
                </MDBRow>
            </MDBContainer>
        </div>
    );
};

export default Login;
