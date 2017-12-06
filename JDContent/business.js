const JD = [];

JD[0] = function ({ storeName, address = '', jobName = '', salary = '', hourly_wages = '', working_type = '', time = '', jobUrl = '', storeUrl = '', figure = '', unit = '', experience = '', sex = '', deadline = '', description = '', contact = '0971456089 (Mai)' }) {
  if (salary) salary = `🏆Lương: ${salary} triệu/tháng\n`;
  if (hourly_wages) hourly_wages = `🏆Lương: ${hourly_wages} k/h + thưởng hấp dẫn\n`;
  if (working_type) working_type = `🏆Hình thức làm việc: ${working_type}\n`;
  if (time) time = `🏆Thời gian làm việc ${time}\n`;
  if (description) description = `🏆Mô tả công việc: ${description}\n`;
  if (unit) unit = `🏆Số lượng cần tuyển: ${unit} ứng viên\n`;
  if (experience) experience = `🏆Yêu cầu kinh nghiệm\n`;
  else experience = '🏆Không cần kinh nghiệm\n';
  if (sex === 'female') sex = `🏆Giới tính: Nữ\n`;
  else if (sex === 'male') sex = `🏆Giới tính: Nam\n`;
  if (figure) figure = '🏆Yêu cầu ngoại hình\n';
  else figure = '🏆Không yêu cầu ngoại hình\n';

  if (storeName.match(/JOBO|Jobo/g)) storeName = `CÔNG TY CÔNG NGHỆ JOBO`;
  const text = `${storeName} TÌM CỘNG SỰ - ${jobName.toUpperCase()}👩‍💻👨‍💻\n
🏆Vị trí của bạn sẽ là: ${jobName}\n
${description}\n
${salary}${hourly_wages}${figure}${experience}${sex}${unit}
🏆Hãy đi tiếp chặng đường mới cùng ${storeName} tại:\n
🎐Cách 1: Vào link: ${jobUrl}  và nhấn "Ứng tuyển không cần CV"\n
🎐Cách 2: Nộp CV vào mail HR@joboapp.com\n
${storeName} chờ bạn và đang rất nóng lòng đóng chào các bạn join team đó, nhanh nhanh nhé!✌️✌️\n🐳${deadline}`;
  return text;
}

JD[1] = function ({ storeName, address = '', jobName = '', salary = '', hourly_wages = '', working_type = '', time = '', jobUrl = '', storeUrl = '', figure = '', unit = '', experience = '', sex = '', deadline = '', description = '', contact = '0971456089 (Mai)' }) {
  if (salary) salary = `Lương: ${salary} triệu/tháng\n`;
  if (hourly_wages) hourly_wages = `Lương: ${hourly_wages} k/h + thưởng hấp dẫn\n`;
  if (working_type) working_type = `Hình thức làm việc: ${working_type}\n`;
  if (time) time = `Thời gian làm việc ${time}\n`;
  if (description) description = `Mô tả công việc: ${description}\n`;
  if (unit) unit = `Số lượng cần tuyển: ${unit} ứng viên\n`;
  if (experience) experience = `Yêu cầu kinh nghiệm\n`;
  else experience = 'Không cần kinh nghiệm\n';
  if (sex === 'female') sex = `Giới tính: Nữ\n`;
  else if (sex === 'male') sex = `Giới tính: Nam\n`;
  if (figure) figure = 'Yêu cầu ngoại hình\n';
  else figure = 'Không yêu cầu ngoại hình\n';

  const text = `Cơ hội trở thành ${jobName} dành cho các bạn mới tốt nghiệp.\n${storeName} địa chỉ ${address}.\n${salary}${hourly_wages}
${description}${figure}${experience}${sex}${unit}
Bạn nào cảm thấy phù hợp có thể gửi CV về hr@joboapp.com
Thông tin chi tiết comment bên dưới hoặc vui lòng inbox mình ;)${deadline}`;
  return text;
}

JD[2] = function ({ storeName, address = '', jobName = '', salary = '', hourly_wages = '', working_type = '', time = '', jobUrl = '', storeUrl = '', figure = '', unit = '', experience = '', sex = '', deadline = '', description = '', contact = '0971456089 (Mai)' }) {
  if (salary) salary = `Với mức lương lên đến : ${salary} triệu/tháng\n`;
  if (hourly_wages) hourly_wages = `Lương: ${hourly_wages} k/h + thưởng hấp dẫn\n`;
  if (working_type) working_type = `Hình thức làm việc: ${working_type}\n`;
  if (time) time = `Thời gian làm việc ${time}\n`;
  if (description) description = `Cùng nhiều phúc lợi hấp dẫn: ${description}\n`;
  if (unit) unit = `Số lượng cần tuyển: ${unit} ứng viên\n`;
  if (experience) experience = `Yêu cầu kinh nghiệm\n`;
  else experience = 'Không cần kinh nghiệm\n';
  if (sex === 'female') sex = `Giới tính: Nữ\n`;
  else if (sex === 'male') sex = `Giới tính: Nam\n`;
  if (figure) figure = 'Yêu cầu ngoại hình\n';
  else figure = 'Không yêu cầu ngoại hình\n';

  const text = `${storeName} tuyển dụng:
🏆Vị trí ${jobName}.
${salary}
${description}${figure}${experience}${sex}${unit}

Ứng tuyển và chat trực tiếp với nhà tuyển dụng tại: ${jobUrl}`
    return text;
}

module.exports = JD;