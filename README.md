# QuoteForge AI 🛡️

**A Deterministic AI-Powered Quoting Engine for Professionals.**

> **Disclaimer**: This system is NOT a chatbot. It is a strict Business Logic Engine that uses AI solely for intent extraction. All prices, quantities, and calculations are deterministic and legally traceable.

## 🚀 Features

*   **Anti-Hallucination Architecture**: AI extracts *intent*, but Code calculates *price*.
*   **Deep Traceability**: Every generated quote includes an Audit Log of the AI prompt and Rules applied.
*   **Business Rules Engine**: Deterministic logic for discounts, compatibility checks, and unit conversions.
*   **Strict Validation**: Quotes are rejected if confidence is low or pricing data is missing.
*   **Secure API**: Full JWT Authentication and Role-Based Access Control (RBAC).

## 🛠️ Tech Stack

*   **Framework**: [NestJS](https://nestjs.com/) (TypeScript)
*   **Database**: PostgreSQL + [Prisma ORM](https://www.prisma.io/)
*   **AI**: Google Gemini Pro (via GenAI SDK)
*   **Validation**: Zod + Class-Validator
*   **Testing**: Jest

## 📦 Installation & Setup

1.  **Clone the repository**
    ```bash
    git clone https://github.com/softpython2884/QuoteForge-AI.git
    cd quote-forge-ai
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Setup Database**
    Make sure you have Docker running, then start the PostgreSQL container:
    ```bash
    docker-compose up -d
    ```

4.  **Configure Environment**
    Rename `.env.example` to `.env` (passed privately) and set your keys:
    ```env
    DATABASE_URL="postgresql://postgres:postgres@localhost:5432/quoteforge?schema=public"
    GEMINI_API_KEY="your-google-gemini-key"
    JWT_SECRET="your-secret-key"
    ```

5.  **Run Migrations**
    ```bash
    npx prisma migrate dev
    ```

6.  **Start the Server**
    ```bash
    npm run start:dev
    ```

## 🔌 API Usage

### 1. Authenticate
**POST** `/auth/login`
```json
{ "companyId": "your_company_id" }
```
*Returns: Bearer Token*

### 2. Generate Quote
**POST** `/quotes/generate`
*Header: `Authorization: Bearer <TOKEN>`*
```json
{
  "requestText": "I need to tile my living room, about 45 square meters.",
  "customerName": "John Doe"
}
```

### 3. Admin / Audit
**GET** `/admin/logs`
*View the exact reasoning behind every quote.*

## 📄 License

This project is licensed under the MIT License with **Strict Attribution Requirements**.
See [LICENSE](./LICENSE) for details.
**Credit**: NightFury / FogeNetwork.

---
*Built with ❤️ by Night.*
