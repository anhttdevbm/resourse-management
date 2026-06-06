import { React, useState, useEffect } from 'react';
import {
    MDBBtn,
    MDBContainer,
    MDBRow,
    MDBCol,
    MDBCard,
    MDBCardBody,
    MDBInput,
    MDBIcon
} from 'mdb-react-ui-kit';
import '../../setting.scss'
import './ResetPassword.scss';
import '@fortawesome/fontawesome-free/css/all.min.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useDispatch } from 'react-redux';
import { setToast } from '../../redux/slice/toastSlice';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../../services/AuthService';
 
function ResetPassword() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    
    const [formData, setFormData] = useState({
        new_password: '',
        confirm_password: ''
    });
    const [loading, setLoading] = useState(false);
    const [token, setToken] = useState('');
    const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 phút tính bằng giây
    
    useEffect(() => {
        const tokenFromUrl = searchParams.get('token');
        if (tokenFromUrl) {
            setToken(tokenFromUrl);
        } else {
            dispatch(setToast({ message: "Invalid reset link!", type: "error" }));
            navigate('/login');
        }
    }, [searchParams, dispatch, navigate]);
    
    // Countdown timer
    useEffect(() => {
        if (timeLeft > 0) {
            const timer = setTimeout(() => {
                setTimeLeft(timeLeft - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else {
            dispatch(setToast({ message: "Reset link has expired!", type: "error" }));
            navigate('/login');
        }
    }, [timeLeft, dispatch, navigate]);
    
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.new_password !== formData.confirm_password) {
            dispatch(setToast({ message: "Passwords do not match!", type: "error" }));
            return;
        }
        
        if (formData.new_password.length < 6) {
            dispatch(setToast({ message: "Password must be at least 6 characters!", type: "error" }));
            return;
        }
        
        setLoading(true);
        
        try {
            const success = await resetPassword(token, formData.new_password);
            
            if (success) {
                dispatch(setToast({ message: "Password reset successfully!", type: "success" }));
                navigate('/login');
            } else {
                dispatch(setToast({ message: "Failed to reset password!", type: "error" }));
            }
        } catch (error) {
            console.error('Reset password error:', error);
            dispatch(setToast({ message: "An error occurred. Please try again!", type: "error" }));
        } finally {
            setLoading(false);
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
                            <h3 className="text-center mb-4">Reset Password</h3>
                            
                            {/* Countdown Timer */}
                            <div className="alert alert-warning text-center mb-4" role="alert">
                                <i className="fas fa-clock me-2"></i>
                                <strong>Time remaining: {formatTime(timeLeft)}</strong>
                                <br />
                                <small>This reset link will expire in {formatTime(timeLeft)}</small>
                            </div>
                            
                            <form onSubmit={handleSubmit}>
                                <div className="mb-4">
                                    <label htmlFor="new_password" className="form-label">New Password</label>
                                    <MDBInput
                                        wrapperClass='mb-4'
                                        id='new_password'
                                        type='password'
                                        name='new_password'
                                        value={formData.new_password}
                                        onChange={handleChange}
                                        className='form-control'
                                        required
                                    />
                                </div>
                                
                                <div className="mb-4">
                                    <label htmlFor="confirm_password" className="form-label">Confirm Password</label>
                                    <MDBInput
                                        wrapperClass='mb-4'
                                        id='confirm_password'
                                        type='password'
                                        name='confirm_password'
                                        value={formData.confirm_password}
                                        onChange={handleChange}
                                        className='form-control'
                                        required
                                    />
                                </div>
                                
                                <MDBBtn type='submit' className='w-100 mb-4' size='md' disabled={loading}>
                                    {loading ? 'Resetting...' : 'Reset Password'}
                                </MDBBtn>
                            </form>
                            
                            <div className='text-center'>
                                <p>Remember your password? <a href="/login" className='text-primary'>Login here</a></p>
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

export default ResetPassword;
