const JD = [];

JD[0] = function ({storeName, address = '', jobName = '', salary = '', hourly_wages = '', working_type = '', time = '', jobUrl = '', storeUrl = '', figure = '', unit = '', experience = '', sex = '', deadline = '', description = '', contact = '0971456089 (Mai)'}) {
    if (salary) salary = `Lương: ${salary} triệu/tháng\n`;
    if (hourly_wages) hourly_wages = `Lương: ${hourly_wages} k/h + thưởng hấp dẫn\n`;
    if (working_type) working_type = `Hình thức làm việc: ${working_type}\n`;
    let timeStr = '';
    if (time) {
        if (time.length > 1) {
            timeStr = 'Thời gian làm:\n';
            time.forEach(t => timeStr += `- ${t.start} đến ${t.end}\n`);
        } else timeStr = `Thời gian làm: ${time[0].start} - ${time[0].end}\n`;
    }
    if (description) description = `Mô tả công việc: ${description}\n`;
    if (unit) unit = `Số lượng cần tuyển: ${unit} ứng viên\n`;
    if (experience) experience = `Yêu cầu kinh nghiệm\n`;
    else experience = 'Không cần kinh nghiệm\n';
    if (sex === 'female') sex = `Giới tính: Nữ\n`;
    else if (sex === 'male') sex = `Giới tính: Nam\n`;
    if (figure) figure = 'Yêu cầu ngoại hình\n';
    else figure = 'Không yêu cầu ngoại hình\n';

    const text = `${storeName} tại ${address} hiện đang "nhắn tìm đồng đội"\n
JOBO nhận được thông báo khẩn "nhắn tìm đồng đội" từ biệt đội ${storeName}:\n
   Vị trí: ${jobName}\n
   ${salary}${hourly_wages}${working_type}${timeStr}${description}\n${figure}${unit}${experience}${sex}
Bỏ ra 1 phút để tìm hiểu thêm thông tin và gia nhập đồng đội ngay hôm nay tại: ${jobUrl}   \n
Các bạn chỉ cần hoàn thành hồ sơ tại link trên, ${storeName} sẽ liên hệ lại ngay và đi làm luôn!\n
Nếu khó khăn cứ cmt ngay dưới hoặc liên hệ ${contact} nhé!\n\n
------------------------------------\n
Nếu cơ sở đó không thuận tiện cho bạn đi lại, tham khảo các cơ sở khác tại : ${storeUrl}\n\n    `;
    return text;
}

JD[1] = function ({storeName, address = '', jobName = '', salary = '', hourly_wages = '', working_type = '', time = '', jobUrl = '', storeUrl = '', figure = '', unit = '', experience = '', sex = '', deadline = '', description = '', contact = '0971456089 (Mai)'}) {
    if (salary) salary = `Lương: ${salary} triệu/tháng\n`;
    if (hourly_wages) hourly_wages = `Lương: ${hourly_wages} k/h + thưởng hấp dẫn\n`;
    if (working_type) working_type = `Hình thức làm việc: ${working_type}\n`;
    let timeStr = '';
    if (time) {
        if (time.length > 1) {
            timeStr = 'Thời gian làm:\n';
            time.forEach(t => timeStr += `- ${t.start} đến ${t.end}\n`);
        } else timeStr = `Thời gian làm: ${time[0].start} - ${time[0].end}\n`;
    }
    if (description) description = `Mô tả công việc: ${description}\n`;
    if (unit) unit = `Số lượng cần tuyển: ${unit} ứng viên\n`;
    if (experience) experience = `Yêu cầu kinh nghiệm\n`;
    else experience = 'Không cần kinh nghiệm\n';
    if (sex === 'female') sex = `Giới tính: Nữ\n`;
    else if (sex === 'male') sex = `Giới tính: Nam\n`;
    if (figure) figure = 'Yêu cầu ngoại hình\n';
    else figure = 'Không yêu cầu ngoại hình\n';

    const text = `TUYỂN DỤNG TẠI NHÀ HÀNG ${storeName}\n
SANG TUẦN ĐI LÀM LUÔN\n\n
   🏆Địa chỉ: ${address}\n
   🏆Vị trí tuyển dụng: ${jobName}\n
${timeStr}
${salary}${hourly_wages}${figure}${unit}${experience}${sex}
Có chế độ hưởng, thưởng,những ngày lễ...\n\n
#ỨNG TUYỂN TẠI: ${jobUrl}    (Ghi đúng số điện thoại để mình liên hệ lại)\n
Liên hệ ngay : ${contact}\n\n    `;
    return text;
}

JD[2] = function ({storeName, address = '', jobName = '', salary = '', hourly_wages = '', working_type = '', time = '', jobUrl = '', storeUrl = '', figure = '', unit = '', experience = '', sex = '', deadline = '', description = '', contact = '0971456089 (Mai)'}) {
    if (salary) salary = `Lương: ${salary} triệu/tháng\n`;
    if (hourly_wages) hourly_wages = `Lương: ${hourly_wages} k/h + thưởng hấp dẫn\n`;
    if (working_type) working_type = `Hình thức làm việc: ${working_type}\n`;
    let timeStr = '';
    if (time) {
        if (time.length > 1) {
            timeStr = 'Thời gian làm:\n';
            time.forEach(t => timeStr += `- ${t.start} đến ${t.end}\n`);
        } else timeStr = `Thời gian làm: ${time[0].start} - ${time[0].end}\n`;
    }
    if (description) description = `Mô tả công việc: ${description}\n`;
    if (unit) unit = `Số lượng cần tuyển: ${unit} ứng viên\n`;
    if (experience) experience = `Yêu cầu kinh nghiệm\n`;
    else experience = 'Không cần kinh nghiệm\n';
    if (sex === 'female') sex = `Giới tính: Nữ\n`;
    else if (sex === 'male') sex = `Giới tính: Nam\n`;
    if (figure) figure = 'Yêu cầu ngoại hình\n';
    else figure = 'Không yêu cầu ngoại hình\n';

    const text = `Có bạn nào quanh khu vực ${address}, mình cần tuyển GẤP nhân viên ${jobName} tại ${storeName}\n
   ${salary}${hourly_wages}${working_type}${timeStr}${description}${figure}${unit}${experience}${sex}
Nếu chưa rõ các bạn có thể xem cụ thể tại đây ${jobUrl}    và ứng tuyển theo link đó để mình xem trước thông tin và hẹn lịch đi phỏng vấn và đi làm ngay.\n
Mình cần tuyển rất gấp , bạn nào có bạn bè cần tìm việc ở ${address} thì giới thiệu, tag vào giúp mình với nha. Mình cảm ơn.\n
Liên hệ ${contact}.\n\n    `;
    return text;
};

JD[3] = function ({storeName, address = '', jobName = '', salary = '', hourly_wages = '', working_type = '', time = '', jobUrl = '', storeUrl = '', figure = '', unit = '', experience = '', sex = '', deadline = '', description = '', contact = '0971456089 (Mai)'}) {
    if (salary) salary = `Lương: ${salary} triệu/tháng\n`;
    if (hourly_wages) hourly_wages = `Lương: ${hourly_wages} k/h + thưởng hấp dẫn\n`;
    if (working_type) working_type = `Hình thức làm việc: ${working_type}\n`;
    let timeStr = '';
    if (time) {
        if (time.length > 1) {
            timeStr = 'Thời gian làm:\n';
            time.forEach(t => timeStr += `- ${t.start} đến ${t.end}\n`);
        } else timeStr = `Thời gian làm: ${time[0].start} - ${time[0].end}\n`;
    }
    if (description) description = `Mô tả công việc: ${description}\n`;
    if (unit) unit = `Số lượng cần tuyển: ${unit} ứng viên\n`;
    if (experience) experience = `Yêu cầu kinh nghiệm\n`;
    else experience = 'Không cần kinh nghiệm\n';
    if (sex === 'female') sex = `Giới tính: Nữ\n`;
    else if (sex === 'male') sex = `Giới tính: Nam\n`;
    if (figure) figure = 'Yêu cầu ngoại hình\n';
    else figure = 'Không yêu cầu ngoại hình\n';

    const text = `Mình thấy trong group có nhiều bạn đăng tin tìm việc ở ${address}, mình cũng cần tuyển rất GẤP cho Nhà hàng mình tại ${address} mà sao không gặp được nhau nhỉ.\n
Hy vọng tin này đến được các bạn cần tìm việc!\n\n
  ${storeName}\n
  🏆Địa chỉ: ${address}\n
  🏆Vị trí cần tuyển: ${jobName}\n
  ${figure}${unit}
${salary}${hourly_wages}
${timeStr}\n${experience}${sex}
Môi trường làm việc của Nhà hàng mình nhiều bạn trẻ, vui vẻ và năng động nên luôn luôn chào đón các bạn mới gia nhập đội ngũ nhé!\n
Các bạn có thể liên hệ ${contact}  để trao đổi hoặc nếu có thể thì hoàn thành đơn ứng tuyển tại link này ${jobUrl}    để tiết kiệm thời gian cho cả hai luôn!\n\n
Mình còn tuyển cho nhiều cơ sở nữa trên hầu hết quận ở Hà Nội nên nếu cơ sở này không phù hợp để đi lại thì vẫn có thể điền link trên rồi mình xếp vào vị trí phù hợp gần nhà bạn.\n\n
Mình cảm ơn nhé!\n    `;
    return text;
};

JD[4] = function ({storeName, address = '', jobName = '', salary = '', hourly_wages = '', working_type = '', time = '', jobUrl = '', storeUrl = '', figure = '', unit = '', experience = '', sex = '', deadline = '', description = '', contact = '0971456089 (Mai)'}) {
    if (salary) salary = `Lương: ${salary} triệu/tháng\n`;
    if (hourly_wages) hourly_wages = `Lương: ${hourly_wages} k/h + thưởng hấp dẫn\n`;
    if (working_type) working_type = `Hình thức làm việc: ${working_type}\n`;
    let timeStr = '';
    if (time) {
        if (time.length > 1) {
            timeStr = 'Thời gian làm:\n';
            time.forEach(t => timeStr += `- ${t.start} đến ${t.end}\n`);
        } else timeStr = `Thời gian làm: ${time[0].start} - ${time[0].end}\n`;
    }
    if (description) description = `Mô tả công việc: ${description}\n`;
    if (unit) unit = `Số lượng cần tuyển: ${unit} ứng viên\n`;
    if (experience) experience = `Yêu cầu kinh nghiệm\n`;
    else experience = 'Không cần kinh nghiệm\n';
    if (sex === 'female') sex = `Giới tính: Nữ\n`;
    else if (sex === 'male') sex = `Giới tính: Nam\n`;
    if (figure) figure = 'Yêu cầu ngoại hình\n';
    else figure = 'Không yêu cầu ngoại hình\n';

    const text = `Tuyển gấp cho Nhà hàng ăn cao cấp tại ${address} nhiều vị trí:\n\n
${salary}${hourly_wages}\n
${timeStr}\n${figure}${unit}${experience}${sex}
-Bảo vệ\n
-Thu ngân\n
-Tạp vụ\n
-Phục vụ\n
-Lễ tân\n
-Giám sát/ Trưởng bàn\n
-....\n\n
#ƯU_TIÊN_GẮN_BÓ_LÂU_DÀI\n
#Nếu có thắc mắc gì cmt mình giải đáp hoặc liên hệ ${contact}\n
#Hoàn thành link online này thay cho hồ sơ xin việc bình thường để tiện Nhà hàng xem trước và hẹn lịch đi làm ngay cho bạn: ${jobUrl}   \n
Lưu ý ghi đúng số điện thoại và địa chỉ để mình sắp xếp vào cơ sở gần nhất.\n\n    `;
    return text;
}

JD[5] = function ({storeName, address = '', jobName = '', salary = '', hourly_wages = '', working_type = '', time = '', jobUrl = '', storeUrl = '', figure = '', unit = '', experience = '', sex = '', deadline = '', description = '', contact = '0971456089 (Mai)'}) {
    if (salary) salary = `Lương: ${salary} triệu/tháng\n`;
    if (hourly_wages) hourly_wages = `Lương: ${hourly_wages} k/h + thưởng hấp dẫn\n`;
    if (working_type) working_type = `Hình thức làm việc: ${working_type}\n`;
    let timeStr = '';
    if (time) {
        if (time.length > 1) {
            timeStr = 'Thời gian làm:\n';
            time.forEach(t => timeStr += `- ${t.start} đến ${t.end}\n`);
        } else timeStr = `Thời gian làm: ${time[0].start} - ${time[0].end}\n`;
    }
    if (description) description = `Mô tả công việc: ${description}\n`;
    if (unit) unit = `Số lượng cần tuyển: ${unit} ứng viên\n`;
    if (experience) experience = `Yêu cầu kinh nghiệm\n`;
    else experience = 'Không yêu cầu kinh nghiệm và sẽ được đào tạo các bạn ạ, chỉ cần ham học hỏi là được\n';
    if (sex === 'female') sex = `Giới tính: Nữ\n`;
    else if (sex === 'male') sex = `Giới tính: Nam\n`;
    if (figure) figure = 'Yêu cầu ngoại hình\n';
    else figure = 'Không yêu cầu ngoại hình\n';

    const text = `Nhà hàng mình đang làm cần tuyển nên mình đăng giúp!\n\n
${storeName}\n
🏆Địa chỉ ở: ${address}\n
${timeStr}\n${figure}${unit}
${salary}${hourly_wages}${experience}${sex}
Môi trường làm việc trẻ trung và được giúp đỡ tạo điều kiện rất nhiều
Có chế độ thưởng, lương, BHXH (nếu làm lâu dài có BHXH ,...)\n\n
Các bạn muốn hỏi thêm liên hệ ${contact} nhé\n
Mình ghi thông tin chi tiết tại link: ${jobUrl}   , các bạn xem kĩ và nhấn ứng tuyển luôn ở đó ,lập hồ sơ rồi chị quản lý liên hệ đi làm ngay nhé vì bên mình tuyển gấp.\nCác bạn đi qua giúp mình chấm cho đỡ bài nhé, mình cảm ơn.\n\n    `;
    return text;
}

JD[6] = function ({storeName, address = '', jobName = '', salary = '', hourly_wages = '', working_type = '', time = '', jobUrl = '', storeUrl = '', figure = '', unit = '', experience = '', sex = '', deadline = '', description = '', contact = '0971456089 (Mai)'}) {
    if (salary) salary = `Lương: ${salary} triệu/tháng\n`;
    if (hourly_wages) hourly_wages = `Lương: ${hourly_wages} k/h + thưởng hấp dẫn\n`;
    if (working_type) working_type = `Hình thức làm việc: ${working_type}\n`;
    let timeStr = '';
    if (time) {
        if (time.length > 1) {
            timeStr = 'Thời gian làm:\n';
            time.forEach(t => timeStr += `- ${t.start} giờ đến ${t.end} giờ\n`);
        } else timeStr = `Thời gian làm: ${time[0].start} giờ - ${time[0].end} giờ\n`;
    }
    if (description) description = `Mô tả công việc: ${description}\n`;
    if (unit) unit = `Số lượng cần tuyển: ${unit} ứng viên\n`;
    if (experience) experience = `Yêu cầu kinh nghiệm\n`;
    else experience = 'Không cần kinh nghiệm\n';
    if (sex === 'female') sex = `Giới tính: Nữ\n`;
    else if (sex === 'male') sex = `Giới tính: Nam\n`;
    if (figure) figure = 'Yêu cầu ngoại hình\n';
    else figure = 'Không yêu cầu ngoại hình\n';

    const text = `Không có công việc nào việc nhẹ nhàn hạ lương cao đâu các bạn ạ, Sinh viên xác định kiếm thêm thu nhập thì chịu khó hơi vất vả một tý.\n\n
Mình có tuyển nhân viên ${jobName} ở ${storeName} tại ${address}, công việc sẽ không nhàn nhưng đảm bảo chân chính và ổn định\n
${timeStr}${figure}${unit}
${salary}${hourly_wages}${experience}${sex}
Sẽ tạo điều kiện cho sinh viên muốn đi làm kiếm thêm thu nhập vì mình biết các bạn vừa học, vừa làm rất khó xếp lịch\n\n
Các bạn muốn hỏi thêm liên hệ ${contact} nhé\n
Mình ghi thông tin chi tiết tại link: ${jobUrl}   , các bạn xem kĩ và nhấn ứng tuyển luôn ở đó ,lập hồ sơ rồi mình liên hệ đi làm ngay nhé vì đang tuyển gấp.\n
Các bạn đi qua giúp mình chấm cho đỡ bài nhé, mình cảm ơn.\n\n    `;
    return text;
}

JD[7] = function ({storeName, address = '', jobName = '', salary = '', hourly_wages = '', working_type = '', time = '', jobUrl = '', storeUrl = '', figure = '', unit = '', experience = '', sex = '', deadline = '', description = '', contact = '0971456089 (Mai)'}) {
    if (salary) salary = `Lương: ${salary} triệu/tháng\n`;
    if (hourly_wages) hourly_wages = `Lương: ${hourly_wages} k/h + thưởng hấp dẫn\n`;
    if (working_type) working_type = `Hình thức làm việc: ${working_type}\n`;
    let timeStr = '';
    if (time) {
        if (time.length > 1) {
            timeStr = 'Thời gian làm:\n';
            time.forEach(t => timeStr += `- ${t.start} giờ đến ${t.end} giờ\n`);
        } else timeStr = `Thời gian làm: ${time[0].start} giờ - ${time[0].end} giờ`;
    }
    if (description) description = `Mô tả công việc: ${description}\n`;
    if (unit) unit = `Số lượng cần tuyển: ${unit} ứng viên\n`;
    if (experience) experience = `Yêu cầu kinh nghiệm\n`;
    else experience = 'Không cần kinh nghiệm\n';
    if (sex === 'female') sex = `Giới tính: Nữ\n`;
    else if (sex === 'male') sex = `Giới tính: Nam\n`;
    if (figure) figure = 'Yêu cầu ngoại hình\n';
    else figure = 'Không yêu cầu ngoại hình\n';

    const text = `Đối với một nhà hàng, món ăn ngon và hấp dẫn chưa đủ sức thuyết phục thực khách hoàn toàn. Yếu tố nội thất sang trọng, bài trí đẹp mắt và cung cách phục vụ chuyên nghiệp cũng góp phần rất quan trọng trong việc “giữ chân” khách hàng. Hãy để bản thân trở thành một phần lý do với nhà hàng chúng tôi.\n
${storeName} tìm đồng đội:\n\n
Vị trí ${jobName}${figure}${unit}
${timeStr}${salary}${hourly_wages}${experience}${sex}
Phụ cấp 1 bữa trong ngày, có cơ hội làm việc trong môi trường nhà hàng chuyên nghiệp, giúp trau dồi tiếng Anh, tiếng Hoa.\n
Truy cập vào đường ${jobUrl}    và ứng tuyển\n
Hoặc liên hệ số điện thoại: ${contact}\n
Bên mình sẽ liên lạc và tư vấn trực tiếp cho các bạn nhé!\n\n    `;
    return text;
}

JD[8] = function ({storeName, address = '', jobName = '', salary = '', hourly_wages = '', working_type = '', time = '', jobUrl = '', storeUrl = '', figure = '', unit = '', experience = '', sex = '', deadline = '', description = '', contact = '0971456089 (Mai)'}) {
    const text = `${storeName} tại ${address}, tuyển phục vụ với lương cứng. Bạn nào quan tâm thì liên hệ với SĐT ${contact} nhé!    `;
    return text;
}

JD[9] = function ({storeName, address = '', jobName = '', salary = '', hourly_wages = '', working_type = '', time = '', jobUrl = '', storeUrl = '', figure = '', unit = '', experience = '', sex = '', deadline = '', description = '', contact = '0971456089 (Mai)'}) {
    if (salary) salary = `Lương: ${salary} triệu/tháng\n`;
    if (hourly_wages) hourly_wages = `Lương: ${hourly_wages} k/h + thưởng hấp dẫn\n`;
    if (working_type) working_type = `Hình thức làm việc: ${working_type}\n`;
    let timeStr = '';
    if (time) {
        if (time.length > 1) {
            timeStr = 'Thời gian làm:\n';
            time.forEach(t => timeStr += `- ${t.start} giờ đến ${t.end} giờ\n`);
        } else timeStr = `Thời gian làm: ${time[0].start} giờ - ${time[0].end} giờ`;
    }
    if (description) description = `Mô tả công việc: ${description}\n`;
    if (unit) unit = `Số lượng cần tuyển: ${unit} ứng viên\n`;
    if (experience) experience = `Yêu cầu kinh nghiệm\n`;
    else experience = 'Không cần kinh nghiệm\n';
    if (sex === 'female') sex = `Giới tính: Nữ\n`;
    else if (sex === 'male') sex = `Giới tính: Nam\n`;
    if (figure) figure = 'Yêu cầu ngoại hình\n';
    else figure = 'Không yêu cầu ngoại hình\n';

    const text = `Bạn muốn làm tại ${storeName} ở ${address} với lương tối thiểu 3 triệu/ tháng? Nếu đó là những yêu cầu công việc của bạn thì ${storeName} KHÔNG PHẢI là một nơi PHÙ HỢP cho bạn. Vì ngoài mức lương cứng tối thiểu 3tr8/ tháng, bạn còn được tặng thêm 680,000đ tiền cơm cùng hàng loạt các khoảng hậu đãi xứng đáng khác.\n
Nếu bạn muốn nằm trong nhóm "người hiếm" muốn thử sức với công việc không PHÙ HỢP này thì bạn có thể liên hệ ${contact}. Còn không, bạn có thể tiếp tục tìm một công việc khác, phù hợp hơn qua Jobo nhé!!!\n${jobUrl}\n    `;
    return text;
}

JD[10] = function ({storeName, address = '', jobName = '', salary = '', hourly_wages = '', working_type = '', time = '', jobUrl = '', storeUrl = '', figure = '', unit = '', experience = '', sex = '', deadline = '', description = '', contact = '0971456089 (Mai)'}) {
    if (salary) salary = `😍Lương cứng ${salary} triệu/tháng\n`;
    if (hourly_wages) hourly_wages = `😍Lương theo giờ: ${hourly_wages} k/h + cơm + TIP 600-800 + thưởng Target\n`;
    if (working_type) working_type = `Hình thức làm việc: ${working_type}\n`;
    let timeStr = '';
    if (time) {
        if (time.length > 1) {
            timeStr = '😍Thời gian:\n';
            time.forEach(t => timeStr += `- ${t.start} giờ đến ${t.end} giờ\n`);
        } else timeStr = `😍Thời gian: ${time[0].start} giờ - ${time[0].end} giờ`;
    }
    if (description) description = `Mô tả công việc: ${description}\n`;
    if (unit) unit = `Số lượng cần tuyển: ${unit} ứng viên\n`;
    if (experience) experience = `Yêu cầu kinh nghiệm\n`;
    else experience = 'Không cần kinh nghiệm\n';
    if (sex === 'female') sex = `Giới tính: Nữ\n`;
    else if (sex === 'male') sex = `Giới tính: Nam\n`;
    if (figure) figure = 'Yêu cầu ngoại hình\n';
    else figure = 'Không yêu cầu ngoại hình\n';

    const text = `(~~> Ok)Mình cần tìm các bạn có thể làm nhân viên tại ${storeName}.
${timeStr}
${salary}${hourly_wages}
😍Địa chỉ: ${address}.
😍Không phải đóng bất kỳ khoản thu nào khi đi làm.
-------
Bạn nào quan tâm mời liên hệ SĐT ${contact} hoặc inbox mình nhé!!\n    `;
    return text;
}

JD[11] = function ({storeName, address = '', jobName = '', salary = '', hourly_wages = '', working_type = '', time = '', jobUrl = '', storeUrl = '', figure = '', unit = '', experience = '', sex = '', deadline = '', description = '', contact = '0971456089 (Mai)'}) {
    if (salary) salary = `Lương cứng ${salary} triệu/tháng\n`;
    if (hourly_wages) hourly_wages = `Lương theo giờ: ${hourly_wages} k/h + cơm + TIP 600-800 + thưởng Target\n`;
    if (working_type) working_type = `Hình thức làm việc: ${working_type}\n`;
    let timeStr = '';
    if (time) {
        if (time.length > 1) {
            timeStr = 'Ca làm:\n';
            time.forEach(t => timeStr += `- ${t.start} giờ đến ${t.end} giờ\n`);
        } else timeStr = `Ca làm: ${time[0].start} giờ - ${time[0].end} giờ`;
    }
    if (description) description = `Mô tả công việc: ${description}\n`;
    if (unit) unit = `Số lượng cần tuyển: ${unit} ứng viên\n`;
    if (experience) experience = `Yêu cầu kinh nghiệm\n`;
    else experience = 'Không cần kinh nghiệm\n';
    if (sex === 'female') sex = `Giới tính: Nữ\n`;
    else if (sex === 'male') sex = `Giới tính: Nam\n`;
    if (figure) figure = 'Yêu cầu ngoại hình\n';
    else figure = 'Không yêu cầu ngoại hình\n';

    const text = `${storeName.toUpperCase()}
  - ${salary}${hourly_wages}
  - ${timeStr}
  - ${address}.
  Quan tâm! Ứng viên Liên hệ: ${contact}.    `;
    return text;
}

JD[12] = function ({storeName, address = '', jobName = 'nhân viên', salary = '', hourly_wages = '', working_type = '', time = '', jobUrl = '', storeUrl = '', figure = '', unit = '', experience = '', sex = '', deadline = '', description = '', contact = '0971456089 (Mai)'}) {

    if (salary) salary = `lương cứng ${salary} triệu/tháng`;
    if (hourly_wages) hourly_wages = `lương theo giờ: ${hourly_wages} k/h + cơm + TIP 600-800 + thưởng Target`;
    if (working_type) working_type = `Hình thức làm việc: ${working_type}\n`;
    let timeStr = '';
    if (time) {
        if (time.length > 1) {
            timeStr = ' làm ca';
            time.forEach(t => timeStr += ` ${t.start} giờ đến ${t.end} giờ,`);
        } else timeStr = ` làm ca ${time[0].start} giờ đến ${time[0].end} giờ,`;
    }
    if (description) description = `Mô tả công việc: ${description}\n`;
    if (unit) unit = `Số lượng cần tuyển: ${unit} ứng viên\n`;
    if (experience) experience = `Yêu cầu kinh nghiệm\n`;
    else experience = 'Không cần kinh nghiệm\n';
    if (sex === 'female') sex = `Giới tính: Nữ\n`;
    else if (sex === 'male') sex = `Giới tính: Nam\n`;
    if (figure) figure = 'Yêu cầu ngoại hình\n';
    else figure = 'Không yêu cầu ngoại hình\n';

    const text = `Mình cần tuyển các bạn ${jobName} ${timeStr} ${salary}${hourly_wages}, bao ăn. Ai quan tâm inbox hoặc liên hệ ${contact} nhé.\n    `;
    return text;
}

JD[13] = function ({storeName, address = '', jobName = '', salary = '', hourly_wages = '', working_type = '', time = '', jobUrl = '', storeUrl = '', figure = '', unit = '', experience = '', sex = '', deadline = '', description = '', contact = '0971456089 (Mai)'}) {
    if (salary) salary = `lương cứng ${salary} triệu/tháng`;
    if (hourly_wages) hourly_wages = `lương theo giờ: ${hourly_wages} k/h + cơm + TIP 600-800 + thưởng Target`;
    if (working_type) working_type = `Hình thức làm việc: ${working_type}\n`;
    let timeStr = '';
    if (time) {
        if (time.length > 1) {
            timeStr = ' làm ca';
            time.forEach(t => timeStr += ` ${t.start} giờ đến ${t.end} giờ,`);
        } else timeStr = ` làm ca ${time[0].start} giờ đến ${time[0].end} giờ,`;
    }
    if (description) description = `Mô tả công việc: ${description}\n`;
    if (unit) unit = `Mình đang cần tuyển gấp ${unit} bạn cho`;
    else unit = 'Mình đang cần tuyển gấp nhân viên cho';
    if (experience) experience = `Yêu cầu kinh nghiệm\n`;
    else experience = 'Không cần kinh nghiệm\n';
    if (sex === 'female') sex = `Giới tính: Nữ\n`;
    else if (sex === 'male') sex = `Giới tính: Nam\n`;
    if (figure) figure = 'Yêu cầu ngoại hình\n';
    else figure = 'Không yêu cầu ngoại hình\n';

    const text = `${unit} ${storeName} vị trí ${jobName}
 Bạn nào đăng ký thì inbox mình hoặc liên hệ ${contact} nhé, mình sẽ gửi JD và cách thức đăng ký. Cực nhanh, cực tiện lợi.\nThông tin thêm tại đây: ${jobUrl}\n    `;
    return text;
}

module.exports = JD;