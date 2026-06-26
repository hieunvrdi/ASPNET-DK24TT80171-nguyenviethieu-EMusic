# EMusic — Website nghe nhạc trực tuyến

## Yêu cầu môi trường (cài một lần)

| Tool | Version | Kiểm tra |
|---|---|---|
| .NET SDK | 8.x | `dotnet --version` |
| Node.js | 18+ | `node --version` |
| Docker Desktop | bất kỳ | `docker --version` |
| dotnet-ef | bất kỳ | `dotnet ef --version` |

Cài dotnet-ef nếu chưa có:
```powershell
dotnet tool install --global dotnet-ef
```

---

## Mỗi lần bắt đầu làm việc

```powershell
# Terminal 1 — Backend
cd ./src
docker compose up -d
dotnet run --project MusicApp.API

# Terminal 2 — Frontend
cd ./src/music-frontend
# cài đặt các thư viện cần thiết
npm install

#chạy giao diện môi trường dev
npm run dev
```

| Địa chỉ | Mô tả |
|---|---|
| http://localhost:3000 | Frontend (Next.js) |
| http://localhost:5175/swagger | Backend Swagger UI |

### Tài khoản seed sẵn
| Role | Email | Password |
|---|---|---|
| Admin | 170124891@rdi.edu.vn | Admin@12345 |
| UserPro | hieuviet.itc@gmail.com | Pro@12345 |
| User | hieuviet.1103@gmail.com | User@12345 |

### Nếu reset database (xóa data, seed lại)
```powershell
docker compose down -v
docker compose up -d
dotnet ef database update --project MusicApp.Infrastructure --startup-project MusicApp.API
dotnet run --project MusicApp.API   # seed data tự chạy khi startup
```

---

## 1 — Foundation 

- Solution `MusicApp.sln` với 3 projects (API, Core, Infrastructure)
- 8 Entities, Interfaces, DTOs trong Core
- AppDbContext, 7 Repositories, FileService, TokenService trong Infrastructure
- Program.cs, appsettings.json, MappingProfile, ExceptionMiddleware
- `docker-compose.yml` cho SQL Server 2022
- DataSeeder: 3 users, 5 artists, 15 albums, 75 songs (60 Approved + 15 Pending), 2 playlists

### Cấu trúc Core
```
MusicApp.Core/
├── Entities/         User, Artist, Album, Song, Playlist, PlaylistSong, PlayHistory, FavoriteSong
├── Enums/            SongStatus (Pending, Approved, Rejected)
├── DTOs/             Auth, Songs, Artists, Albums, Playlists, Admin, Common
└── Interfaces/       IRepository<T>, ISongRepository, IUserRepository, ...
```

---

## 2 — Core Domain Backend 

### Controllers đã tạo
| File | Endpoints |
|---|---|
| `AuthController.cs` | `POST /register`, `POST /login`, `GET /me` |
| `SongsController.cs` | `GET /songs`, `GET /songs/{id}`, `GET /songs/{id}/stream`, `POST /songs`, `DELETE /songs/{id}` |
| `ArtistsController.cs` | `GET /artists`, `GET /artists/{id}`, `GET /artists/{id}/songs`, `POST /artists` |
| `AlbumsController.cs` | `GET /albums/{id}`, `GET /albums/{id}/songs`, `GET /albums/by-artist/{artistId}`, `POST /albums` |

---

## 3 — Playlists + Player UI 

### 3A — Backend Playlists
| File | Endpoints |
|---|---|
| `PlaylistsController.cs` | `GET /playlists`, `GET /playlists/{id}`, `POST /playlists`, `PUT /playlists/{id}`, `DELETE /playlists/{id}`, `POST /playlists/{id}/songs`, `DELETE /playlists/{id}/songs/{songId}`, `PUT /playlists/{id}/reorder` |
| `FavoritesController.cs` | `GET /favorites`, `POST /favorites/{songId}` (toggle) |

### 3B — Frontend Next.js

### Backend AdminController
| Endpoint | Mô tả | Policy |
|---|---|---|
| `GET /api/admin/stats` | 7 số liệu: users, songs, approved, pending, plays, artists, albums | AdminOnly |
| `GET /api/admin/songs/pending` | Danh sách bài chờ duyệt (kèm artist, uploader) | AdminOnly |
| `PATCH /api/admin/songs/{id}/approve` | Duyệt bài: Pending → Approved | AdminOnly |
| `PATCH /api/admin/songs/{id}/reject` | Từ chối: Pending → Rejected | AdminOnly |
| `GET /api/admin/users` | Danh sách user kèm số bài đã upload | AdminOnly |

### Frontend Admin
```
src/app/
├── admin/
│   ├── layout.tsx          Role guard: user.role !== "Admin" → redirect /
│   ├── page.tsx            Dashboard: 7 stat cards + quick links
│   ├── pending/page.tsx    Bảng bài chờ + Duyệt/Từ chối (optimistic UI)
│   └── users/page.tsx      Bảng user với role badge màu
└── upload/page.tsx         Form upload: chọn file → auto-detect duration → artist/album
```

### Demo Script — Test toàn bộ hệ thống
```
1. Vào http://localhost:3000
   → Browse bài hát → Nhấn play → Âm thanh phát trong trình duyệt 

2. Chuyển sang /songs → PlayerBar vẫn hiển thị, nhạc tiếp tục phát 
   → Tìm kiếm bài hát → kết quả cập nhật theo debounce 300ms 

3. Login bằng hieuviet.1103@gmail.com / User@12345
   → /playlists → Tạo playlist "Nhạc Yêu Thích"
   → Vào /songs, thêm bài vào playlist
   → Quay lại /playlists → thấy bài đã thêm 

4. /upload → Upload .mp3
   → Status hiển thị "Đang chờ duyệt" (role User) 

5. Logout → Login bằng 170124891@rdi.edu.vn / Admin@12345
   → /admin → Thấy thống kê 
   → /admin/pending → Thấy bài chờ duyệt
   → Nhấn "Duyệt"
   → Nhấn "Từ chối"

6. /upload với admin → Upload .mp3 → Status "Đã đăng" ngay 

7. Logout → Login bằng hieuviet.itc@gmail.com / Pro@12345
   → /upload → Upload .mp3 → Status "Đã đăng" ngay 
```
