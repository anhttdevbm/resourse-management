import { useEffect, useState } from "react"
import PageHeading from "../../../components/heading"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from "../../../components/ui/card"
import { Checkbox } from "../../../components/ui/checkbox"
import { Switch } from "../../../components/ui/switch"
import {  Button } from "../../../components/ui/button"
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "../../../components/ui/table"
import { Link } from "react-router-dom"
import { FaRegEdit } from "react-icons/fa"
import { RiDeleteBin5Line } from "react-icons/ri"
import { MdLockReset } from "react-icons/md"
import { pagination } from "../../../services/UserService"
import { useQuery } from "react-query"
import { LoadingSpinner } from "../../../components/ui/loading"
import { AxiosError } from "axios";

const User = () => {
    const breadcrumb ={
        title: 'Quản lý thành viên',
        route: '/user/index'
    }
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const { isLoading, data = { users: [], total: 0, page: 1, page_size: 10 }, isError, error, refetch } = useQuery(['users', page, pageSize], () => pagination(page, pageSize));
    const users = data.users || [];
    const total = data.total || 0;
    const totalPages = Math.ceil(total / pageSize);

    const handlePrev = () => setPage((p) => Math.max(1, p - 1));
    const handleNext = () => setPage((p) => Math.min(totalPages, p + 1));

    const renderError = () => {
        let code = '';
        if (error && (error as AxiosError).response) {
            code = (error as AxiosError).response?.status?.toString() || '';
        }
        return (
            <TableRow>
                <TableCell colSpan={6} className="text-center text-[12px] text-[#f00000]">
                    Lỗi tải dữ liệu. Vui lòng thử lại{code && ` - Mã lỗi ${code}`}
                </TableCell>
            </TableRow>
        );
    };

    return (
        <>
           <PageHeading breadcrumb={breadcrumb}/>
           <div className="container">
            <Card className="rounded-[5px] mt-[15px]">
                <CardHeader className="border-b border-solid border-[#f3f3f3] p-[20px]">
                    <CardTitle className="uppercase">
                        Quản lý danh sách nhân viên
                    </CardTitle>
                    <CardDescription className="text-xs text-[f00000]">
                        Hiển thị danh sách nhân viên , sử dụng các chức năng bên dưới để lọc theo mong muốn
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-[15px]">
                    <Table className="border border-solid border-[#ebebeb]">
                        <TableCaption>Danh sách thành viên.</TableCaption>
                        <TableHeader>
                            <TableRow>
                                <TableHead><Checkbox className="text-white"/></TableHead>
                                <TableHead>ID</TableHead>
                                <TableHead>Họ tên</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead className="text-center">Tình trạng</TableHead>
                                <TableHead className="text-center">Thao tác</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center">
                                    <LoadingSpinner className="inline-block mr-2" /> Đang tải dữ liệu...
                                    </TableCell>
                                </TableRow>
                                ) : isError ? (
                                renderError()
                                ) : users.map((user: any, idx: number) => (
                                <TableRow key={user.id || idx}>
                                    <TableCell><Checkbox /></TableCell>
                                    <TableCell>{user.id}</TableCell>
                                    <TableCell>{user.name}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell className="text-center">
                                    {user.active ? "Hoạt động" : "Đã khóa"}
                                    </TableCell>
                                    <TableCell className="flex gap-2">
                                    <Link to={`/user/update/${user.id}`}>
                                        <Button><FaRegEdit className="text-white" /></Button>
                                    </Link>
                                    <Link to={`/user/delete/${user.id}`}>
                                        <Button className="bg-red-500"><RiDeleteBin5Line className="text-white" /></Button>
                                    </Link>
                                    <Link to={`/user/reset/${user.id}`}>
                                        <Button className="bg-yellow-500"><MdLockReset className="text-white" /></Button>
                                    </Link>
                                    </TableCell>
                                </TableRow>
                                ))}

                        </TableBody>
                    </Table>
                </CardContent>
                <div className="flex justify-between items-center px-4 py-2">
                    <span>
                        Trang {page} / {totalPages || 1} (Tổng: {total})
                    </span>
                    <div className="flex gap-2">
                        <Button onClick={handlePrev} disabled={page === 1}>Trước</Button>
                        <Button onClick={handleNext} disabled={page === totalPages || totalPages === 0}>Sau</Button>
                    </div>
                </div>
              <CardFooter>
                    <p>Card Footer</p>
                </CardFooter>
                
            </Card>
           </div>
        </>
    )
}
export default User