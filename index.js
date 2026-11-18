const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('SePay Telegram Bot is running!'));
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

const token = process.env.TELEGRAM_BOT_TOKEN;
const sepayToken = process.env.SEPAY_API_TOKEN;
const bankAccountId = process.env.BANK_ACCOUNT_ID;

if (!token || !sepayToken || !bankAccountId) {
  console.error('Thiếu thông tin cấu hình biến môi trường!');
}

const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "👋 Chào bạn! Gửi cú pháp sau để tạo số tài khoản ảo (VA) định danh:\n\n/tao [Tên_Khách_Hàng]\n\nVí dụ: /tao NguyenVanA");
});

bot.onText(/\/tao (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const customerName = match[1].trim();

  bot.sendMessage(chatId, `⏳ Đang tạo tài khoản ảo cho: ${customerName}...`);

  try {
    const response = await axios.post(
      'https://my.sepay.vn/user/api/v1/virtual-accounts',
      {
        bank_account_id: bankAccountId,
        name: customerName
      },
      {
        headers: {
          'Authorization': `Bearer ${sepayToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const data = response.data;
    if (data && data.status === 'success') {
      const vaNumber = data.data.account_number;
      const vaName = data.data.name;
      
      bot.sendMessage(chatId, `✅ **Tạo tài khoản ảo thành công!**\n\n📌 Chủ tài khoản: ${vaName}\n💳 Số tài khoản VA: \`${vaNumber}\`\n🏦 Ngân hàng: VietinBank`, { parse_mode: 'Markdown' });
    } else {
      bot.sendMessage(chatId, `❌ Lỗi từ SePay: ${data.message || 'Không thể tạo tài khoản ảo.'}`);
    }
  } catch (error) {
    console.error(error.response?.data || error.message);
    bot.sendMessage(chatId, `❌ Đã xảy ra lỗi kết nối đến API SePay. Vui lòng kiểm tra lại token!`);
  }
});
