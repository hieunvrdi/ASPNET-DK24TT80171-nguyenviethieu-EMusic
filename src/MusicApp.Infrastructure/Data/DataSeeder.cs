using BCrypt.Net;
using Microsoft.EntityFrameworkCore;
using MusicApp.Core.Entities;
using MusicApp.Core.Enums;

namespace MusicApp.Infrastructure.Data;

public static class DataSeeder
{
    public static async Task SeedAsync(AppDbContext context)
    {
        // Seed genres independently (not tied to user check)
        if (!await context.Genres.AnyAsync())
        {
            var genres = new List<Genre>
            {
                new Genre { Name = "Pop",        Slug = "pop" },
                new Genre { Name = "Rock",       Slug = "rock" },
                new Genre { Name = "R&B",        Slug = "rnb" },
                new Genre { Name = "Hip-Hop",    Slug = "hiphop" },
                new Genre { Name = "Jazz",       Slug = "jazz" },
                new Genre { Name = "Classical",  Slug = "classical" },
                new Genre { Name = "Electronic", Slug = "electronic" },
                new Genre { Name = "Indie",      Slug = "indie" },
                new Genre { Name = "Country",    Slug = "country" },
                new Genre { Name = "K-Pop",      Slug = "kpop" },
                new Genre { Name = "V-Pop",      Slug = "vpop" },
                new Genre { Name = "Ballad",     Slug = "ballad" },
                new Genre { Name = "Folk",       Slug = "folk" },
                new Genre { Name = "Metal",      Slug = "metal" },
            };
            await context.Genres.AddRangeAsync(genres);
            await context.SaveChangesAsync();
        }

        if (await context.Users.AnyAsync()) return;

        // Users
        var adminUser = new User
        {
            UserName = "admin",
            Email = "170124891@rdi.edu.vn",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@12345"),
            Role = "Admin",
            CreatedAt = DateTime.UtcNow.AddMonths(-6)
        };
        var proUser = new User
        {
            UserName = "hieuviet",
            Email = "hieuviet.itc@gmail.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Pro@12345"),
            Role = "UserPro",
            CreatedAt = DateTime.UtcNow.AddMonths(-3)
        };
        var basicUser = new User
        {
            UserName = "hieuviet1103",
            Email = "hieuviet.1103@gmail.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("User@12345"),
            Role = "User",
            CreatedAt = DateTime.UtcNow.AddMonths(-1)
        };

        await context.Users.AddRangeAsync(adminUser, proUser, basicUser);
        await context.SaveChangesAsync();

        // Artists
        var artistNames = new[] { "Sơn Tùng M-TP", "Đen Vâu", "Hoàng Thùy Linh", "Mỹ Tâm", "Noo Phước Thịnh" };
        var artists = artistNames.Select((name, i) => new Artist
        {
            Name = name,
            Bio = $"Nghệ sĩ nổi tiếng {name} với phong cách âm nhạc độc đáo.",
            UploadedBy = adminUser.Id
        }).ToList();

        await context.Artists.AddRangeAsync(artists);
        await context.SaveChangesAsync();

        // Albums (3 per artist)
        var albumTitles = new[]
        {
            new[] { "m-tp M-TP", "Sky Tour", "There's No One At All" },
            new[] { "Tâm Thư", "Mang Tiền Về Cho Mẹ", "Blackjack" },
            new[] { "Hoàng", "Tứ Phủ", "Địa Ngục Bóng Tối" },
            new[] { "Tâm 9", "My Everything", "Stronger" },
            new[] { "Như Ngày Hôm Qua", "Walk", "Only You" }
        };

        var albums = new List<Album>();
        for (int i = 0; i < artists.Count; i++)
        {
            for (int j = 0; j < 3; j++)
            {
                albums.Add(new Album
                {
                    Title = albumTitles[i][j],
                    ArtistId = artists[i].Id,
                    ReleaseYear = 2020 + i + j
                });
            }
        }

        await context.Albums.AddRangeAsync(albums);
        await context.SaveChangesAsync();

        // Songs (5 per album = 75 total, last album's last 3 songs are Pending)
        var songs = new List<Song>();
        int songCount = 0;
        var songTitles = new[]
        {
            "Bài Hát Yêu Thích", "Nhạc Pop Hiện Đại", "Giai Điệu Mùa Hè",
            "Tình Ca Xưa", "Những Kỷ Niệm Đẹp"
        };

        foreach (var album in albums)
        {
            for (int k = 0; k < 5; k++)
            {
                songCount++;
                // Last 15 songs (songs 61-75) are Pending
                var status = songCount <= 60 ? SongStatus.Approved : SongStatus.Pending;
                var uploader = status == SongStatus.Pending ? basicUser : adminUser;

                songs.Add(new Song
                {
                    Title = $"{songTitles[k]} {songCount}",
                    ArtistId = album.ArtistId,
                    AlbumId = album.Id,
                    FilePath = $"songs/{album.ArtistId}/sample_{songCount}.mp3",
                    DurationSeconds = 180 + (k * 30),
                    PlayCount = status == SongStatus.Approved ? (100 - songCount) * 10 : 0,
                    Status = status,
                    UploadedBy = uploader.Id,
                    UploadedAt = DateTime.UtcNow.AddDays(-songCount)
                });
            }
        }

        await context.Songs.AddRangeAsync(songs);
        await context.SaveChangesAsync();

        // Playlists for basicUser
        var playlist1 = new Playlist
        {
            UserId = basicUser.Id,
            Name = "Nhạc Yêu Thích",
            IsPublic = true,
            CreatedAt = DateTime.UtcNow.AddDays(-7)
        };
        var playlist2 = new Playlist
        {
            UserId = basicUser.Id,
            Name = "Nhạc Buổi Sáng",
            IsPublic = false,
            CreatedAt = DateTime.UtcNow.AddDays(-3)
        };

        await context.Playlists.AddRangeAsync(playlist1, playlist2);
        await context.SaveChangesAsync();

        // Add first 5 approved songs to playlist 1
        var approvedSongs = songs.Where(s => s.Status == SongStatus.Approved).Take(5).ToList();
        var playlistSongs = approvedSongs.Select((s, i) => new PlaylistSong
        {
            PlaylistId = playlist1.Id,
            SongId = s.Id,
            OrderIndex = i
        }).ToList();

        await context.PlaylistSongs.AddRangeAsync(playlistSongs);

        // Favorites for basicUser
        var favoriteSongs = approvedSongs.Take(3).Select(s => new FavoriteSong
        {
            UserId = basicUser.Id,
            SongId = s.Id,
            AddedAt = DateTime.UtcNow.AddDays(-2)
        }).ToList();

        await context.FavoriteSongs.AddRangeAsync(favoriteSongs);
        await context.SaveChangesAsync();
    }
}
