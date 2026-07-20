import { React, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MDBBtn,
    MDBContainer,
    MDBRow,
    MDBCol,
    MDBCard,
    MDBCardBody,
    MDBInput,
    MDBIcon
}
    from 'mdb-react-ui-kit';
import '../../setting.scss'
import './ForgotPassword.scss';
import '@fortawesome/fontawesome-free/css/all.min.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { forgotPassword, googleLogin, githubLogin, twitterLogin, facebookLogin, fetchUser } from '../../services/AuthService';
import { useDispatch } from 'react-redux';
import { setToast } from '../../redux/slice/toastSlice';
import { setAuthLogin } from '../../redux/slice/authSlice';
import { cookieStorage } from '../../utils/cookie';


function ForgotPassword() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    // Khởi tạo state cho các trường nhập liệu
    const [formData, setFormData] = useState({
        email: ''
    });
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    // Handle social login callbacks (tokens may be in hash fragment)
    useEffect(() => {
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        const urlParams = new URLSearchParams(window.location.search);
        const accessToken = hashParams.get('access_token') || urlParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token') || urlParams.get('refresh_token');
        const loginType = hashParams.get('login_type') || urlParams.get('login_type');
        const code = urlParams.get('code');
        const codeVerifier = urlParams.get('code_verifier');

        if (accessToken && loginType === 'facebook') {
            // Handle Facebook OAuth callback
            cookieStorage.setItem("accessToken", accessToken, { expires: 7 });
            if (refreshToken) {
                cookieStorage.setItem("refreshToken", refreshToken, { expires: 30 });
            }
            handleSocialSuccess();
        } else if (accessToken && loginType === 'twitter') {
            // Handle Twitter OAuth callback
            cookieStorage.setItem("accessToken", accessToken, { expires: 7 });
            if (refreshToken) {
                cookieStorage.setItem("refreshToken", refreshToken, { expires: 30 });
            }
            handleSocialSuccess();
        } else if (accessToken && loginType === 'google') {
            // Handle Google OAuth callback
            cookieStorage.setItem("accessToken", accessToken, { expires: 7 });
            if (refreshToken) {
                cookieStorage.setItem("refreshToken", refreshToken, { expires: 30 });
            }
            handleSocialSuccess();
        } else if (accessToken && loginType === 'github') {
            // Handle GitHub OAuth callback
            cookieStorage.setItem("accessToken", accessToken, { expires: 7 });
            if (refreshToken) {
                cookieStorage.setItem("refreshToken", refreshToken, { expires: 30 });
            }
            handleSocialSuccess();
        }
    }, []);

    // Handle successful social login
    const handleSocialSuccess = async () => {
        try {
            const user = await fetchUser();
            if (user) {
                dispatch(setAuthLogin(user));
                navigate("/dashboard");
            }
        } catch (error) {
            console.error('Social login success error:', error);
            dispatch(setToast({ message: "Có lỗi xảy ra khi đăng nhập!", type: "error" }));
        }
    };
    
    // Hàm xử lý khi có sự thay đổi trên các trường nhập liệu
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };
    
    // Hàm xử lý khi nút "Xác nhận" được nhấn
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            const success = await forgotPassword(formData.email);
            if (success) {
                setMessage('Đã gửi email reset password về hộp thư của bạn, hãy kiểm tra email!');
                dispatch(setToast({ message: "Email reset password đã được gửi!", type: "success" }));
            } else {
                setMessage('Có lỗi xảy ra, vui lòng thử lại!');
                dispatch(setToast({ message: "Có lỗi xảy ra khi gửi email reset!", type: "error" }));
            }
        } catch (error) {
            console.error('Forgot password error:', error);
            setMessage('Có lỗi xảy ra, vui lòng thử lại!');
            dispatch(setToast({ message: "Có lỗi xảy ra khi gửi email reset!", type: "error" }));
        } finally {
            setLoading(false);
        }
    };
    // Hàm xử lý khi click vào một social icon button
    const handleSocialIconClick = async (iconName) => {
        console.log(`Clicked social icon: ${iconName}`);
        
        try {
            switch (iconName) {
                case 'google':
                    await googleLogin();
                    break;
                case 'github':
                    await githubLogin();
                    break;
                case 'twitter':
                    await twitterLogin();
                    break;
                case 'facebook':
                    await facebookLogin();
                    break;
                default:
                    console.log(`Unknown social icon: ${iconName}`);
            }
        } catch (error) {
            console.error(`Error with ${iconName} login:`, error);
            dispatch(setToast({ 
                message: `Error with ${iconName} login. Please try again.`, 
                type: "error" 
            }));
        }
    };
    return (
        <MDBContainer fluid className='p-4 background-radial-gradient overflow-hidden height-800 pt-5'>
            <MDBRow>
                <MDBCol md='3' className='text-center text-md-start d-flex flex-column justify-content-center pt-20'>
                </MDBCol>
                <MDBCol md='6' className='position-relative'>
                    <div id="radius-shape-1" className="position-absolute rounded-circle shadow-5-strong"></div>
                    <div id="radius-shape-2" className="position-absolute shadow-5-strong"></div>
                    <MDBCard className='my-5 bg-glass'>
                        <MDBCardBody className='p-5'>
                            <form onSubmit={handleSubmit}>
                                <p>Email</p>
                                <MDBInput
                                    wrapperClass='mb-4'
                                    id='email'
                                    type='text'
                                    name='email'
                                    value={formData.email}
                                    onChange={handleChange}
                                    className='form-control'
                                />
                                <MDBBtn type='submit' className='w-100 mb-4' size='md' disabled={loading}>
                                    {loading ? 'Đang gửi...' : 'Xác nhận'}
                                </MDBBtn>
                                {message && <div className="alert alert-info mt-4">{message}</div>}
                            </form>
                            <div className='text-center'>
                                <p>Login with:</p>
                                <MDBBtn 
                                    tag='button' 
                                    color='none' 
                                    className='mx-3' 
                                    style={{ color: '#1266f1' }}
                                    onClick={() => handleSocialIconClick('facebook')}
                                    disabled={loading}
                                >
                                    <MDBIcon fab icon='facebook-f' size='sm' />
                                </MDBBtn>

                                <MDBBtn 
                                    tag='button' 
                                    color='none' 
                                    className='mx-3' 
                                    style={{ color: '#1DA1F2' }}
                                    onClick={() => handleSocialIconClick('twitter')}
                                    disabled={loading}
                                >
                                    <MDBIcon fab icon='twitter' size="sm" />
                                </MDBBtn>

                                <MDBBtn 
                                    tag='button' 
                                    color='none' 
                                    className='mx-3' 
                                    style={{ color: '#DB4437' }}
                                    onClick={() => handleSocialIconClick('google')}
                                    disabled={loading}
                                >
                                    <MDBIcon fab icon='google' size="sm" />
                                </MDBBtn>

                                <MDBBtn 
                                    tag='button' 
                                    color='none' 
                                    className='mx-3' 
                                    style={{ color: '#333' }}
                                    onClick={() => handleSocialIconClick('github')}
                                    disabled={loading}
                                >
                                    <MDBIcon fab icon='github' size="sm" />
                                </MDBBtn>
                            </div>
                        </MDBCardBody>
                    </MDBCard>
                </MDBCol>
                <MDBCol md='3' className='text-center text-md-start d-flex flex-column justify-content-center pt-20'>
                </MDBCol>
            </MDBRow>
        </MDBContainer>
    );
}
export default ForgotPassword;
