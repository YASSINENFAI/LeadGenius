<div align="center">

# 🚀 LeadGenius

### **Free AI-Powered Lead Generation & Email Outreach Tool**

**Find leads • Generate personalized emails • Automate outreach**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

[⭐ Star this repo](https://github.com/YASSINENFAI/LeadGenius) • [🐛 Report Bug](https://github.com/YASSINENFAI/LeadGenius/issues) • [💡 Request Feature](https://github.com/YASSINENFAI/LeadGenius/issues)

</div>

---

## 📖 What is LeadGenius?

**LeadGenius** is a powerful, **FREE** open-source tool that helps you:

- 🔍 **Find Leads Automatically** - Discover potential customers from Google Maps
- ✉️ **Generate Personalized Emails** - AI creates unique emails for each lead
- 📊 **Track Everything** - Monitor opens, replies, and conversions
- 🤖 **Auto Follow-ups** - Automatically send follow-ups after 3 days
- 📱 **Telegram Notifications** - Get instant alerts on your phone
- 🌍 **Multi-Language Support** - Works in English, Dutch, and Arabic

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔍 **Smart Lead Discovery** | Scrape Google Maps for businesses in any niche |
| 🤖 **8 AI Providers** | OpenAI, Claude, GLM, Groq, DeepSeek, Kimi, MiniMax, Ollama |
| ✉️ **Personalized Emails** | AI generates unique emails for each lead |
| 📧 **Email Templates** | 21 templates in 3 languages (63 total) |
| 📊 **Dashboard** | Real-time stats and activity feed |
| 🎯 **Lead Scoring** | AI scores leads 0-100 based on potential |
| 📅 **Email Scheduling** | Schedule emails for the perfect time |
| 🔄 **Auto Follow-ups** | Smart reminders after 3 days |
| 📱 **Telegram Bot** | Get notified instantly |
| 🌐 **Multi-Language** | English, Dutch, Arabic |

---

## 🎬 Demo

```
┌─────────────────────────────────────────────────────────────┐
│  📊 DASHBOARD                                                │
├─────────────────────────────────────────────────────────────┤
│  Total Leads: 66     Analyzed: 34    Contacted: 31         │
│                                                              │
│  ✅ Email sent to MAAK Advocaten                            │
│  ✅ Email sent to Restaurant Parkheuvel                     │
│  📧 Email opened by Kennedy Van der Laan                    │
│  💬 Reply from Stibbe                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Redis (optional, for background jobs)
- AI API key (OpenAI, Claude, or use **FREE GLM API**)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/YASSINENFAI/LeadGenius.git
cd LeadGenius

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your settings

# 4. Set up database
npx prisma migrate dev

# 5. Start the app
npm run dev
```

### Access the App

- 🌐 **Frontend**: http://localhost:3000
- 🔌 **API**: http://localhost:3001

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/leadgenius"

# AI Provider (Choose one or more)
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-..."
GLM_API_KEY="..."  # FREE at z.ai

# Email (Choose one)
SMTP_HOST="smtp.gmail.com"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Telegram Bot (Optional)
TELEGRAM_BOT_TOKEN="..."
TELEGRAM_CHAT_ID="..."
```

---

## 🤖 AI Providers

LeadGenius supports **8 AI providers**:

| Provider | Free Tier | Quality | Speed |
|----------|-----------|---------|-------|
| **GLM** | ✅ Yes | ⭐⭐⭐⭐ | ⚡⚡⚡⚡⚡ |
| OpenAI | ❌ No | ⭐⭐⭐⭐⭐ | ⚡⚡⚡⚡ |
| Claude | ❌ No | ⭐⭐⭐⭐⭐ | ⚡⚡⚡ |
| Groq | ✅ Limited | ⭐⭐⭐⭐ | ⚡⚡⚡⚡⚡ |
| DeepSeek | ✅ Limited | ⭐⭐⭐⭐ | ⚡⚡⚡⚡ |
| Kimi | ❌ No | ⭐⭐⭐⭐ | ⚡⚡⚡ |
| MiniMax | ❌ No | ⭐⭐⭐⭐ | ⚡⚡⚡ |
| Ollama | ✅ Local | ⭐⭐⭐ | ⚡⚡ |

**💡 Recommended**: Start with **GLM** - it's completely FREE!

---

## 📱 Telegram Bot Setup

Get instant notifications on your phone:

1. **Create a bot**: Message [@BotFather](https://t.me/botfather) on Telegram
2. **Get your Chat ID**: Message [@userinfobot](https://t.me/userinfobot)
3. **Add to `.env`**:
   ```env
   TELEGRAM_BOT_TOKEN="your-bot-token"
   TELEGRAM_CHAT_ID="your-chat-id"
   ```
4. **Configure in Settings**: Go to Settings → Notifications → Telegram

---

## 📧 Email Setup

### Option 1: Gmail SMTP (Easiest)

1. Enable 2FA on your Gmail account
2. Generate an App Password: Google Account → Security → App Passwords
3. Add to `.env`:
   ```env
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT="587"
   SMTP_USER="your-email@gmail.com"
   SMTP_PASS="your-16-char-app-password"
   ```

### Option 2: Resend (Recommended for production)

1. Sign up at [resend.com](https://resend.com)
2. Verify your domain
3. Add to `.env`:
   ```env
   RESEND_API_KEY="re_..."
   ```

---

## 🎯 How to Use

### 1. Find Leads

```
Go to "Agents" → Enter search query → Run
Example: "restaurants in Amsterdam"
```

### 2. Generate Emails

```
Go to "Pipeline" → Select leads → Click "Generate Email"
AI creates personalized emails for each lead
```

### 3. Send & Track

```
Review emails → Send or Schedule
Dashboard shows opens, replies, and conversions
```

---

## 📊 Dashboard

The dashboard shows:

- **Total Leads**: All discovered businesses
- **Analyzed**: Leads scored by AI
- **Contacted**: Emails sent
- **Conversion Rate**: Success percentage
- **Recent Activity**: Real-time feed
- **Email Performance**: Open & reply rates

---

## 🔄 Auto Follow-ups

LeadGenius automatically sends follow-ups:

- ⏰ **After 3 days** from first email
- 🔢 **Max 2 follow-ups** per lead
- 🚫 **Skips** if lead opened or replied
- 📱 **Telegram notification** on send

---

## 🌍 Multi-Language Templates

Available in **3 languages**:

| Template Type | English | Dutch | Arabic |
|---------------|---------|-------|--------|
| General | ✅ | ✅ | ✅ |
| Restaurant | ✅ | ✅ | ✅ |
| Real Estate | ✅ | ✅ | ✅ |
| Healthcare | ✅ | ✅ | ✅ |
| Legal | ✅ | ✅ | ✅ |
| Tech | ✅ | ✅ | ✅ |
| Retail | ✅ | ✅ | ✅ |
| ... | | | |

**Total: 63 templates** (21 types × 3 languages)

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Backend** | Node.js, Fastify, TypeScript |
| **Frontend** | Next.js, React, TailwindCSS |
| **Database** | PostgreSQL, Prisma ORM |
| **Queue** | Redis, BullMQ |
| **AI** | OpenAI SDK (multi-provider) |
| **Email** | Nodemailer, Resend |
| **Scraping** | Playwright, Cheerio |

---

## 📁 Project Structure

```
LeadGenius/
├── src/
│   ├── modules/
│   │   ├── agent/          # Lead discovery agent
│   │   ├── outreach/       # Email generation & sending
│   │   └── scoring/        # Lead scoring
│   ├── workers/
│   │   ├── scheduler.ts    # Scheduled emails
│   │   └── followup.ts     # Auto follow-ups
│   ├── lib/
│   │   ├── ai/            # AI providers
│   │   └── notifications/  # Telegram bot
│   └── routes/            # API endpoints
├── web/
│   ├── app/               # Next.js pages
│   ├── components/        # React components
│   └── lib/              # Frontend utilities
├── prisma/
│   └── schema.prisma     # Database schema
└── templates/            # Email templates
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

**Free to use for personal and commercial projects!**

---

## 🙏 Support

If you find this project helpful, please consider:

- ⭐ **Starring** this repository
- 🐛 **Reporting bugs** via Issues
- 💡 **Suggesting features** via Issues
- 📢 **Sharing** with others

---

## 📞 Contact

**Created by Yassine**

- GitHub: [@YASSINENFAI](https://github.com/YASSINENFAI)
- Email: [azffhk@gmail.com](mailto:azffhk@gmail.com)
- Telegram: [@FGMANO](https://t.me/FGMANO)

---

<div align="center">

**⭐ If you like this project, give it a star! ⭐**

Made with ❤️ by Yassine

</div>
