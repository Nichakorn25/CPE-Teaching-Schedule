# CPE-Teaching-Schedule

## Backend Setup (Go)

1. Initialize Go module:
    ```bash
    go mod init github.com/Nichakorn25/CPE-Teaching-Schedule
    ```

2. Install Go dependencies:
    ```bash
    go get -u github.com/gin-gonic/gin
    go get -u gorm.io/gorm
    go get -u gorm.io/driver/postgres
    go get -u github.com/dgrijalva/jwt-go
    go get -u golang.org/x/crypto@v0.16.0
    go get -u github.com/lib/pq
    go get github.com/golang-jwt/jwt/v5
    ```

---

## Frontend Setup (React + Vite + TailwindCSS + Ant Design)

1. Create frontend project with Vite + React template:
    ```bash
    npm create vite@latest frontend -- --template react
    ```

2. Install TailwindCSS and dependencies:
    ```bash
    npm install -D tailwindcss@3 postcss autoprefixer
    npx tailwindcss init -p
    npm install
    ```

3. Install additional frontend libraries:
    ```bash
    npm install --save react-router-dom@6.x
    npm install antd --save
    npm install axios --save
    npm install dayjs --save
    npm install @ant-design/icons
    npm install lucide-react clsx
    npm install xlsx
    ```

---

## Other Useful Commands

- Install jsPDF (for generating PDFs):
    ```bash
    npm install jspdf
    ```

- Install SweetAlert2 (for alerts):
    ```bash
    npm install sweetalert2
    ```

---

## React Login Form with TypeScript (Optional)

1. Create React app with TypeScript template:
    ```bash
    npx create-react-app login-form --template typescript
    cd login-form
    ```

2. Install TailwindCSS dependencies for the React app:
    ```bash
    npm install -D tailwindcss postcss autoprefixer
    npx tailwindcss init -p
    ```

---

## Notes & Reminders

- **Check your Git branch before commits!**
- **Run `git add .` before commit.**
- **Remove or clean up `package.json` if needed.**

---

## API Keys

