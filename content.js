text =`${job.storeName.toUpperCase()}  TÌM CỘNG SỰ - ${job.jobName.toUpperCase()}👩‍💻👨‍💻
🏆Vị trí của bạn sẽ là : ${job.jobName}
🏆Mô tả công việc:
🎐${job.description}
🏆Hãy đi tiếp chặng đường mới cùng ${job.storeName} tại:
🎐Cách 1: Vào link: ${job.Url} và nhấn "Ứng tuyển không cần CV"
🎐Cách 2: Nạp CV vào mail hr@joboapp.com
JOBO chờ bạn và đang rất nóng lòng đóng chào các bạn join team đó, nhanh nhanh nhé!✌️✌️
🐳`;

text = `Cơ hội trở thành ${job.jobName} dành cho các bạn mới tốt nghiệp `
if(job.salary) text = text + `lương khởi điểm ${job.salary} triệu!`
text = text + `Công ty ${job.jobName} văn phòng ${job.address}.
${job.description}
Bạn nào cảm thấy phù hợp có thể gửi CV về hr@joboapp.com
Thông tin chi tiết hãy comment bên dưới hoặc vui lòng inbox mình ;)`;


