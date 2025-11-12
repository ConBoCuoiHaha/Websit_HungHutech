Trần Yên Hưng - 2280601327
Hutech khu e

Project Quản lý nhân sự (website + app mobile)

Website: Vue js, nodejs, MongoDB  (Quản lý hệ thống)
App mobile: java android (Chấm công bằng vân tay dựa trên định vị vị trí công ty"bắt buộc dùng wifi của công ty để chấm công")

Cách chạy:
cd HungHutech-backend
npm run dev

.Trường hợp app mobile không hoạt động tốt, là do chưa tắt firewall cho port 5000 (tự tùy chỉnh trong setting máy hoặc netsh advfirewall firewall add rule name="Node 5000" dir=in action=allow protocol=TCP localport=5000 profile=private,public)
