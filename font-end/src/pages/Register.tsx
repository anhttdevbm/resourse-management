/**
 * UC-AUTH-02: Đăng ký (Frontend) — cùng luồng token/Redux như UC-AUTH-01 sau khi API thành công.
 * Route: main.tsx /register → AuthService.register → POST /api/auth/user/register
 */
import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  MDBContainer,
  MDBRow,
  MDBCol,
  MDBCard,
  MDBCardBody,
  MDBInput,
} from 'mdb-react-ui-kit';
import { ReloadIcon } from '@radix-ui/react-icons';
import './setting.scss';
import './Login.scss';
import '@fortawesome/fontawesome-free/css/all.min.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Button } from '../components/ui/button';
import { register as registerUser, fetchUser } from '../services/AuthService';
import { setToast } from '../redux/slice/toastSlice';
import { setAuthLogin } from '../redux/slice/authSlice';

type Inputs = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<Inputs>();

  const onSubmit: SubmitHandler<Inputs> = async (payload) => {
    setLoading(true);
    try {
      const auth = await registerUser({
        name: payload.name.trim(),
        email: payload.email.trim(),
        password: payload.password,
      });
      if (auth) {
        const user = await fetchUser();
        dispatch(setToast({ message: 'Đăng ký thành công! Chào mừng bạn.', type: 'success' }));
        dispatch(setAuthLogin(user ?? auth));
        navigate('/dashboard');
      }
      // Lỗi AUTH0008 đã hiển thị toast trong AuthService.register
    } catch (error) {
      console.error('Register error:', error);
      dispatch(setToast({ message: 'Có lỗi xảy ra, vui lòng thử lại!', type: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="background-radial-gradient">
      <MDBContainer fluid className="p-4 login-container">
        <MDBRow className="login-row">
          <MDBCol md="6" className="text-center text-md-start d-flex flex-column justify-content-center pt-20">
            <h1 className="my-5 display-3 fw-bold ls-tight px-3" style={{ color: 'hsl(218, 81%, 95%)' }}>
              Tạo tài khoản <br />
              <span style={{ color: 'hsl(218, 81%, 75%)' }}>Quản lý tài nguyên của bạn</span>
            </h1>
            <p className="px-3" style={{ color: 'hsl(218, 81%, 85%)' }}>
              Đăng ký miễn phí để tải lên, chia sẻ và quản lý tài nguyên trên hệ thống.
            </p>
          </MDBCol>
          <MDBCol md="6" className="position-relative">
            <div id="radius-shape-1" className="position-absolute rounded-circle shadow-5-strong" />
            <div id="radius-shape-2" className="position-absolute shadow-5-strong" />
            <MDBCard className="my-5 bg-glass">
              <MDBCardBody className="p-5">
                <h2 className="text-center fw-bold mb-4">Đăng ký</h2>
                <form onSubmit={handleSubmit(onSubmit)}>
                  <label htmlFor="name">Họ và tên</label>
                  <MDBInput
                    wrapperClass="mb-4"
                    id="name"
                    type="text"
                    placeholder="Nhập họ tên"
                    {...register('name', {
                      required: 'Họ tên là bắt buộc',
                      minLength: { value: 1, message: 'Họ tên không được để trống' },
                    })}
                  />
                  {errors.name && <p className="text-danger text-sm mt-1">{errors.name.message}</p>}

                  <label htmlFor="email">Email</label>
                  <MDBInput
                    wrapperClass="mb-4"
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    {...register('email', {
                      required: 'Email là bắt buộc',
                      pattern: { value: emailPattern, message: 'Email không hợp lệ' },
                    })}
                  />
                  {errors.email && <p className="text-danger text-sm mt-1">{errors.email.message}</p>}

                  <label htmlFor="password">Mật khẩu</label>
                  <MDBInput
                    wrapperClass="mb-4"
                    id="password"
                    type="password"
                    placeholder="Tối thiểu 6 ký tự"
                    {...register('password', {
                      required: 'Mật khẩu là bắt buộc',
                      minLength: { value: 6, message: 'Mật khẩu tối thiểu 6 ký tự' },
                    })}
                  />
                  {errors.password && <p className="text-danger text-sm mt-1">{errors.password.message}</p>}

                  <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
                  <MDBInput
                    wrapperClass="mb-4"
                    id="confirmPassword"
                    type="password"
                    placeholder="Nhập lại mật khẩu"
                    {...register('confirmPassword', {
                      required: 'Vui lòng xác nhận mật khẩu',
                      validate: (v) => v === watch('password') || 'Mật khẩu xác nhận không khớp',
                    })}
                  />
                  {errors.confirmPassword && (
                    <p className="text-danger text-sm mt-1">{errors.confirmPassword.message}</p>
                  )}

                  <Button disabled={loading} className="text-xs w-100 mb-4" type="submit">
                    {loading ? <ReloadIcon className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {loading ? 'Đang xử lý…' : 'Đăng ký'}
                  </Button>
                </form>

                <p className="text-center text-sm mb-0">
                  Đã có tài khoản?{' '}
                  <Link to="/login" className="text-primary fw-semibold">
                    Đăng nhập
                  </Link>
                  {' · '}
                  <Link to="/forgot-password" className="text-primary fw-semibold">
                    Quên mật khẩu
                  </Link>
                </p>
              </MDBCardBody>
            </MDBCard>
          </MDBCol>
        </MDBRow>
      </MDBContainer>
    </div>
  );
};

export default Register;
