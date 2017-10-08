const JD = [];

JD[0] = function ({ storeName, address = '', jobName = '', salary = '', hourly_wages = '', working_type = '', time = '', jobUrl = '', storeUrl = '', figure = '', unit = '', experience = '', sex = '', deadline = '', description = '', contact = '0971456089 (Mai)' }) {

  const text = `Tuyển dụng vị trí ${jobName} tại ${storeName}, làm việc ở ${address}\n
   Mức lương: ${salary}${hourly_wages}\n
   Hình thức: ${working_type}\n
   Thời gian: ${time}\n
   ${figure}
   Số lượng: ${unit}\n
   ${experience}${sex}${description}
Nhanh tay ứng tuyển tại: ${jobUrl}.\n
Liên hệ ${contact}.\n\n${deadline}`;
  return text;
}

JD[1] = function ({ storeName, address = '', jobName = '', salary = '', hourly_wages = '', working_type = '', time = '', jobUrl = '', storeUrl = '', figure = '', unit = '', experience = '', sex = '', deadline = '', description = '', contact = '0971456089 (Mai)' }) {

  if (salary) salary = `Lương khởi điểm: ${salary} triệu`;

  const text = `${storeName.toUpperCase()} TÌM CỘNG SỰ -${jobName.toUpperCase()}👩‍💻👨‍💻
🏆Vị trí của bạn sẽ là :${jobName}
🏆Địa chỉ: ${address}
🏆Mô tả công việc:
🎐${description}
🏆Hãy đi tiếp chặng đường mới cùng ${storeName.toUpperCase()} tại:
🎐Cách 1: Vào link: ${jobUrl} và nhấn "Ứng tuyển không cần CV"
🎐Cách 2: Nộp CV vào mail hr@jobo.asia
JOBO chờ bạn và đang rất nóng lòng đóng chào các bạn join team đó, nhanh nhanh nhé!✌️✌️
🐳
Cơ hội trở thành${jobName}dành cho các bạn mới tốt nghiệp
${salary}
Bạn nào cảm thấy phù hợp có thể gửi CV về hr@jobo.asia
Thông tin chi tiết hãy comment bên dưới hoặc vui lòng inbox mình`;
  return text;
}

module.exports = JD;