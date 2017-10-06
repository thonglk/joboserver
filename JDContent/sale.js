const JD = [];

JD[0] = function ({ storeName, address = '', jobName = '', salary = '', hourly_wages = '', working_type = '', time = '', jobUrl = '', storeUrl = '', figure = '', unit = '', experience = '', sex = '', deadline = '', description = '', contact = '0971456089 (Mai)' }) {
  if (salary) salary = `Với mức lương lên đến : ${salary} triệu/tháng\n`;
  if (hourly_wages) hourly_wages = `Lương: ${hourly_wages} k/h + thưởng hấp dẫn\n`;
  if (working_type) working_type = `Hình thức làm việc: ${working_type}\n`;
  let timeStr = '';
  if (time) {
    if (time.length > 1) {
      timeStr = 'Ca làm:\n';
      time.forEach(t => timeStr += `- ${t.start} đến ${t.end}\n`);
    } else timeStr = `Ca làm: ${time[0].start} - ${time[0].end}\n`;
  }
  if (description) description = `Cùng nhiều phúc lợi hấp dẫn: ${description}\n`;
  if (unit) unit = `Số lượng cần tuyển: ${unit} ứng viên\n`;
  if (experience) experience = `Yêu cầu kinh nghiệm\n`;
  else experience = 'Không cần kinh nghiệm\n';
  if (sex === 'female') sex = `Giới tính: Nữ\n`;
  else if (sex === 'male') sex = `Giới tính: Nam\n`;
  if (figure) figure = 'Yêu cầu ngoại hình\n';
  else figure = 'Không yêu cầu ngoại hình\n';

  const text = `Tuyển ${jobName} ${storeName} tại ${address}.
${timeStr}
${salary}${hourly_wages}
${description}${figure}${experience}${sex}${unit}
L/H: ${contact} nếu các bạn có thắc mắc
Hoàn thành đơn đăng ký tại: ${jobUrl}$primary
(bạn nào hoàn thành xong thì cmt ở dưới để mình check hoặc không hoàn thành được thì cmt sđt ở dưới để mình liên hệ lại)\n\nHạn ứng tuyển còn 2 ngày!`;
  return text;
}

JD[1] = function ({ storeName, address = '', jobName = '', salary = '', hourly_wages = '', working_type = '', time = '', jobUrl = '', storeUrl = '', figure = '', unit = '', experience = '', sex = '', deadline = '', description = '', contact = '0971456089 (Mai)' }) {
  if (salary) salary = `Với mức lương lên đến : ${salary} triệu/tháng\n`;
  if (hourly_wages) hourly_wages = `Lương: ${hourly_wages} k/h + thưởng hấp dẫn\n`;
  if (working_type) working_type = `Hình thức làm việc: ${working_type}\n`;
  let timeStr = '';
  if (time) {
    if (time.length > 1) {
      timeStr = 'Ca làm:\n';
      time.forEach(t => timeStr += `- ${t.start} đến ${t.end}\n`);
    } else timeStr = `Ca làm: ${time[0].start} - ${time[0].end}\n`;
  }
  if (description) description = `Cùng nhiều phúc lợi hấp dẫn: ${description}\n`;
  if (unit) unit = `Số lượng cần tuyển: ${unit} ứng viên\n`;
  if (experience) experience = `Yêu cầu kinh nghiệm\n`;
  else experience = 'Không cần kinh nghiệm\n';
  if (sex === 'female') sex = `Giới tính: Nữ\n`;
  else if (sex === 'male') sex = `Giới tính: Nam\n`;
  if (figure) figure = 'Yêu cầu ngoại hình\n';
  else figure = 'Không yêu cầu ngoại hình\n';

  const text = `Có bạn nào muốn làm ${jobName} không nhỉ?
Mình tuyển cho ${storeName}
${salary}${hourly_wages}
${timeStr}${figure}${experience}${sex}${unit}
Khuyến khích các bạn có định hướng, thiện chí làm ${jobName}
Liên hệ: ${contact}

P/s: Bạn nào nghiêm túc làm thì đk pv nhé, vì nhiều bạn đăng kí nhưng mình hẹn lại k đi pv làm rất mất thời gian
Hoàn thành đơn đăng ký tại: ${jobUrl}$primary
\nHạn ứng tuyển còn 2 ngày!
Mình cảm ơn nhiều!`;
  return text;
}

JD[2] = function ({ storeName, address = '', jobName = '', salary = '', hourly_wages = '', working_type = '', time = '', jobUrl = '', storeUrl = '', figure = '', unit = '', experience = '', sex = '', deadline = '', description = '', contact = '0971456089 (Mai)' }) {
  if (salary) salary = `🏆Với mức lương lên đến : ${salary} triệu/tháng\n`;
  if (hourly_wages) hourly_wages = `🏆Lương: ${hourly_wages} k/h + thưởng hấp dẫn\n`;
  if (working_type) working_type = `🏆Hình thức làm việc: ${working_type}\n`;
  let timeStr = '';
  if (time) {
    if (time.length > 1) {
      timeStr = '🏆Ca làm:\n';
      time.forEach(t => timeStr += `- ${t.start} đến ${t.end}\n`);
    } else timeStr = `🏆Ca làm: ${time[0].start} - ${time[0].end}\n`;
  }
  if (description) description = `🏆Cùng nhiều phúc lợi hấp dẫn: ${description}\n`;
  if (unit) unit = `🏆Số lượng cần tuyển: ${unit} ứng viên\n`;
  if (experience) experience = `🏆Yêu cầu kinh nghiệm\n`;
  else experience = '🏆Không cần kinh nghiệm\n';
  if (sex === 'female') sex = `🏆Giới tính: Nữ\n`;
  else if (sex === 'male') sex = `🏆Giới tính: Nam\n`;
  if (figure) figure = '🏆Yêu cầu ngoại hình\n';
  else figure = '🏆Không yêu cầu ngoại hình\n';


  const text = `[TUYỂN GẤP] – VỊ TRÍ ${jobName.toUpperCase()} tại ${storeName}
${salary}${hourly_wages}
${description}
🏆Làm việc tại chi nhánh: ${address}
${figure}${experience}${sex}${unit}
Nhanh tay ứng tuyển, ưu tiên những bạn ứng tuyển đầu vì số lượng tuyển có hạn.
Click link này để ứng tuyển vị trí của cửa hàng mình: ${jobUrl}$primary
Bên mình sẽ liên lạc lại những ứng viên phù hợp.
\nHạn ứng tuyển còn 2 ngày!`;
  return text;
}

JD[3] = function ({ storeName, address = '', jobName = '', salary = '', hourly_wages = '', working_type = '', time = '', jobUrl = '', storeUrl = '', figure = '', unit = '', experience = '', sex = '', deadline = '', description = '', contact = '0971456089 (Mai)' }) {
  if (salary) salary = `Lương: ${salary} triệu/tháng\n`;
  if (hourly_wages) hourly_wages = `Lương: ${hourly_wages} k/h + thưởng hấp dẫn\n`;
  if (working_type) working_type = `Hình thức làm việc: ${working_type}\n`;

  let timeStr = '';
  if (time) {
    if (time.length > 1) {
      timeStr = 'Ca làm:\n';
      time.forEach(t => timeStr += `- ${t.start} đến ${t.end}\n`);
    } else timeStr = `Ca làm: ${time[0].start} - ${time[0].end}\n`;
  }
  if (description) description = `Mô tả công việc: ${description}\n`;
  if (unit) unit = `Số lượng cần tuyển: ${unit} ứng viên\n`;
  if (experience) experience = `Yêu cầu kinh nghiệm\n`;
  else experience = 'Không cần kinh nghiệm\n';
  if (sex === 'female') sex = `Giới tính: Nữ\n`;
  else if (sex === 'male') sex = `Giới tính: Nam\n`;
  if (figure) figure = 'Yêu cầu ngoại hình\n';
  else figure = 'Không yêu cầu ngoại hình\n';

  const text = `Công việc ổn định dành cho các bạn!
${jobName} tại ${storeName} ở ${address}.
${salary}${hourly_wages}${description}${figure}${experience}${sex}${unit}
Mong bạn nào thật sự có nhu cầu tìm việc và mong muốn làm lâu dài thì theo đường link này đăng kí: ${jobUrl}$primary
Hoặc liên hệ theo số điện thoại này: ${contact}
Bên mình sẽ liên lạc ngay với các ứng viên phù hợp.
\nHạn ứng tuyển còn 2 ngày!
Các bạn đăng ký nghiêm túc nhé, cảm ơn các bạn!`;
  return text;
}

JD[4] = function ({ storeName, address = '', jobName = '', salary = '', hourly_wages = '', working_type = '', time = '', jobUrl = '', storeUrl = '', figure = '', unit = '', experience = '', sex = '', deadline = '', description = '', contact = '0971456089 (Mai)' }) {
  if (salary) salary = `Lương: ${salary} triệu/tháng\n`;
  if (hourly_wages) hourly_wages = `Lương: ${hourly_wages} k/h + thưởng hấp dẫn\n`;
  if (working_type) working_type = `Hình thức làm việc: ${working_type}\n`;
  let timeStr = '';
  if (time) {
    if (time.length > 1) {
      timeStr = 'ca làm:\n';
      time.forEach(t => timeStr += `- ${t.start} đến ${t.end}\n`);
    } else timeStr = `ca làm: ${time[0].start} - ${time[0].end}\n`;
  }
  if (description) description = `Mô tả công việc: ${description}\n`;
  if (unit) unit = `Số lượng cần tuyển: ${unit} ứng viên\n`;
  if (experience) experience = `Yêu cầu kinh nghiệm\n`;
  else experience = 'Không cần kinh nghiệm\n';
  if (sex === 'female') sex = `Giới tính: Nữ\n`;
  else if (sex === 'male') sex = `Giới tính: Nam\n`;
  if (figure) figure = 'Yêu cầu ngoại hình\n';
  else figure = 'Không yêu cầu ngoại hình\n';

  const text = `Tuyển ${jobName} tại ${address} ${timeStr}
${salary}${hourly_wages}
Ưu tiên các bạn có kinh nghiệm hoặc muốn làm trong ngành.
L/H: ${contact} nếu các bạn có thắc mắc
Hoàn thành đơn đăng ký tại: ${jobUrl}
(bạn nào hoàn thành xong thì cmt ở dưới để mình check hoặc không hoàn thành được thì cmt sđt ở dưới để mình liên hệ lại).\nHạn ứng tuyển còn 2 ngày!`;
  return text;
};

JD[5] = function ({ storeName, address = '', jobName = '', salary = '', hourly_wages = '', working_type = '', time = '', jobUrl = '', storeUrl = '', figure = '', unit = '', experience = '', sex = '', deadline = '', description = '', contact = '0971456089 (Mai)' }) {
  if (salary) salary = `Lương: ${salary} triệu/tháng\n`;
  if (hourly_wages) hourly_wages = `Lương: ${hourly_wages} k/h + thưởng hấp dẫn\n`;
  if (working_type) working_type = `Hình thức làm việc: ${working_type}\n`;
  let timeStr = '';
  if (time) {
    if (time.length > 1) {
      timeStr = 'Ca làm:\n';
      time.forEach(t => timeStr += `- ${t.start} đến ${t.end}\n`);
    } else timeStr = `Ca làm: ${time[0].start} - ${time[0].end}\n`;
  }
  if (description) description = `Mô tả công việc: ${description}\n`;
  if (unit) unit = `Số lượng cần tuyển: ${unit} ứng viên\n`;
  if (experience) experience = `Yêu cầu kinh nghiệm\n`;
  else experience = 'Không cần kinh nghiệm\n';
  if (sex === 'female') sex = `Giới tính: Nữ\n`;
  else if (sex === 'male') sex = `Giới tính: Nam\n`;
  if (figure) figure = 'Yêu cầu ngoại hình\n';
  else figure = 'Không yêu cầu ngoại hình\n';

  const text = `Có bạn nào muốn làm ${jobName} không nhỉ?
Mình tuyển cho ${storeName}
${timeStr}${salary}${hourly_wages}
Khuyến khích các bạn có định hướng, thiện chí làm ${jobName}
Liên hệ: ${contact}

P/s: Bạn nào nghiêm túc làm thì đk pv nhé, vì nhiều bạn đăng kí nhưng mình hẹn lại k đi pv làm rất mất thời gian
Hoàn thành đơn đăng ký tại: ${jobUrl}

Hạn chót ứng tuyển còn 2 ngày\n
Mình cảm ơn nhiều!`;
  return text;
};

JD[6] = function ({ storeName, address = '', jobName = '', salary = '', hourly_wages = '', working_type = '', time = '', jobUrl = '', storeUrl = '', figure = '', unit = '', experience = '', sex = '', deadline = '', description = '', contact = '0971456089 (Mai)' }) {
  if (salary) salary = `Lương: ${salary} triệu/tháng\n`;
  if (hourly_wages) hourly_wages = `Lương: ${hourly_wages} k/h + thưởng doanh số\n`;
  if (working_type) working_type = `Hình thức làm việc: ${working_type}\n`;
  let timeStr = '';
  if (time) {
    if (time.length > 1) {
      timeStr = 'Ca làm:\n';
      time.forEach(t => timeStr += `- ${t.start} đến ${t.end}\n`);
    } else timeStr = `Ca làm: ${time[0].start} - ${time[0].end}\n`;
  }
  if (description) description = `Mô tả công việc: ${description}\n`;
  if (unit) unit = `Số lượng cần tuyển: ${unit} ứng viên\n`;
  if (experience) experience = `Yêu cầu kinh nghiệm\n`;
  else experience = 'Không cần kinh nghiệm\n';
  if (sex === 'female') sex = `Giới tính: Nữ\n`;
  else if (sex === 'male') sex = `Giới tính: Nam\n`;
  if (figure) figure = 'Yêu cầu ngoại hình\n';
  else figure = 'Không yêu cầu ngoại hình\n';

  const text = `[TUYỂN GẤP] – VỊ TRÍ ${jobName.toUpperCase()} tại ${storeName.toUpperCase()}
${salary}${hourly_wages}
${description}
Làm việc tại: ${address}
Nhanh tay ứng tuyển, ưu tiên những bạn ứng tuyển đầu vì số lượng tuyển có hạn.
Click link này để ứng tuyển vị trí của cửa hàng mình.
Hạn ứng tuyển còn 2 ngày!\n
Bên mình sẽ liên lạc lại những ứng viên phù hợp.`;
  return text;
};

JD[7] = function ({ storeName, address = '', jobName = '', salary = '', hourly_wages = '', working_type = '', time = '', jobUrl = '', storeUrl = '', figure = '', unit = '', experience = '', sex = '', deadline = '', description = '', contact = '0971456089 (Mai)' }) {
  if (salary) salary = `Lương: ${salary} triệu/tháng\n`;
  if (hourly_wages) hourly_wages = `Lương: ${hourly_wages} k/h + thưởng doanh số\n`;
  if (working_type) working_type = `Hình thức làm việc: ${working_type}\n`;
  let timeStr = '';
  if (time) {
    if (time.length > 1) {
      timeStr = 'Ca làm:\n';
      time.forEach(t => timeStr += `- ${t.start} đến ${t.end}\n`);
    } else timeStr = `Ca làm: ${time[0].start} - ${time[0].end}\n`;
  }
  if (description) description = `Mô tả công việc: ${description}\n`;
  if (unit) unit = `Số lượng cần tuyển: ${unit} ứng viên\n`;
  if (experience) experience = `Yêu cầu kinh nghiệm\n`;
  else experience = 'Không cần kinh nghiệm\n';
  if (sex === 'female') sex = `Giới tính: Nữ\n`;
  else if (sex === 'male') sex = `Giới tính: Nam\n`;
  if (figure) figure = 'Yêu cầu ngoại hình\n';
  else figure = 'Không yêu cầu ngoại hình\n';

  const text = `Công việc ổn định ở ${storeName} vị trí ${jobName} tại địa chỉ ${address}.
${salary}${hourly_wages}
${description}
Mong bạn nào thật sự có nhu cầu tìm việc và mong muốn làm lâu dài thì theo đường link này đăng kí
Hoặc liên hệ theo số điện thoại này:
Bên mình sẽ liên lạc ngay với các ứng viên phù hợp.
Các bạn đăng ký nghiêm túc nhé, cảm ơn các bạn!
Hạn ứng tuyển còn 2 ngày!`;
  return text;
};

module.exports = JD;