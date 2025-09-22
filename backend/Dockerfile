# build stage
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o schedule-backend

# final stage
FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/schedule-backend .
# ไม่ copy .env เข้ามา ให้ใช้ env_file จาก docker-compose แทน
EXPOSE 8080
CMD ["./schedule-backend"]
