import axios from "axios"
import { toast } from "react-toastify"
const handleAxiosError = (error: unknown): void => {
    if (axios.isAxiosError(error)) {
        if (error.response && error.response.data && error.response.data.message) {
            toast.error(error.response.data.message)
        } else {
            toast.error('Network Error')
        }
    } else {
        toast.error("Đã xảy ra lỗi không được xác định. Hãy thử lại sau ")
    }
}
export { handleAxiosError }