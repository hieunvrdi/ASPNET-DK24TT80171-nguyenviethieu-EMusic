using Microsoft.EntityFrameworkCore;
using MusicApp.Core.Entities;
using MusicApp.Core.Enums;

namespace MusicApp.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Artist> Artists => Set<Artist>();
    public DbSet<Album> Albums => Set<Album>();
    public DbSet<Song> Songs => Set<Song>();
    public DbSet<Playlist> Playlists => Set<Playlist>();
    public DbSet<PlaylistSong> PlaylistSongs => Set<PlaylistSong>();
    public DbSet<PlayHistory> PlayHistories => Set<PlayHistory>();
    public DbSet<FavoriteSong> FavoriteSongs => Set<FavoriteSong>();
    public DbSet<Genre> Genres => Set<Genre>();
    public DbSet<SongGenre> SongGenres => Set<SongGenre>();
    public DbSet<SongArtist> SongArtists => Set<SongArtist>();
    public DbSet<AlbumArtist> AlbumArtists => Set<AlbumArtist>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Composite PKs
        modelBuilder.Entity<PlaylistSong>()
            .HasKey(ps => new { ps.PlaylistId, ps.SongId });

        modelBuilder.Entity<FavoriteSong>()
            .HasKey(fs => new { fs.UserId, fs.SongId });

        modelBuilder.Entity<SongGenre>()
            .HasKey(sg => new { sg.SongId, sg.GenreId });
        modelBuilder.Entity<SongGenre>()
            .HasOne(sg => sg.Song)
            .WithMany(s => s.SongGenres)
            .HasForeignKey(sg => sg.SongId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<SongGenre>()
            .HasOne(sg => sg.Genre)
            .WithMany(g => g.SongGenres)
            .HasForeignKey(sg => sg.GenreId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<Genre>()
            .HasIndex(g => g.Slug)
            .IsUnique();

        // Store SongStatus as string
        modelBuilder.Entity<Song>()
            .Property(s => s.Status)
            .HasConversion<string>();

        // Indexes
        modelBuilder.Entity<Song>()
            .HasIndex(s => new { s.Status, s.ArtistId });

        modelBuilder.Entity<Song>()
            .HasIndex(s => s.UploadedBy);

        modelBuilder.Entity<PlayHistory>()
            .HasIndex(ph => new { ph.UserId, ph.PlayedAt });

        modelBuilder.Entity<PlaylistSong>()
            .HasIndex(ps => new { ps.PlaylistId, ps.OrderIndex });

        modelBuilder.Entity<FavoriteSong>()
            .HasIndex(fs => fs.UserId);

        // Relationships — restrict delete on Artist/Album to avoid cycles
        modelBuilder.Entity<Song>()
            .HasOne(s => s.Artist)
            .WithMany(a => a.Songs)
            .HasForeignKey(s => s.ArtistId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Song>()
            .HasOne(s => s.Album)
            .WithMany(a => a.Songs)
            .HasForeignKey(s => s.AlbumId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Song>()
            .HasOne(s => s.Uploader)
            .WithMany(u => u.UploadedSongs)
            .HasForeignKey(s => s.UploadedBy)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Artist>()
            .HasOne(a => a.Uploader)
            .WithMany(u => u.CreatedArtists)
            .HasForeignKey(a => a.UploadedBy)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Album>()
            .HasOne(a => a.Artist)
            .WithMany(ar => ar.Albums)
            .HasForeignKey(a => a.ArtistId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<PlaylistSong>()
            .HasOne(ps => ps.Playlist)
            .WithMany(p => p.PlaylistSongs)
            .HasForeignKey(ps => ps.PlaylistId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<PlaylistSong>()
            .HasOne(ps => ps.Song)
            .WithMany(s => s.PlaylistSongs)
            .HasForeignKey(ps => ps.SongId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<PlayHistory>()
            .HasOne(ph => ph.User)
            .WithMany(u => u.PlayHistories)
            .HasForeignKey(ph => ph.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<PlayHistory>()
            .HasOne(ph => ph.Song)
            .WithMany(s => s.PlayHistories)
            .HasForeignKey(ph => ph.SongId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<FavoriteSong>()
            .HasOne(fs => fs.User)
            .WithMany(u => u.FavoriteSongs)
            .HasForeignKey(fs => fs.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<FavoriteSong>()
            .HasOne(fs => fs.Song)
            .WithMany(s => s.FavoriteSongs)
            .HasForeignKey(fs => fs.SongId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Playlist>()
            .HasOne(p => p.User)
            .WithMany(u => u.Playlists)
            .HasForeignKey(p => p.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // SongArtist composite PK
        modelBuilder.Entity<SongArtist>()
            .HasKey(sa => new { sa.SongId, sa.ArtistId });
        modelBuilder.Entity<SongArtist>()
            .HasOne(sa => sa.Song)
            .WithMany(s => s.SongArtists)
            .HasForeignKey(sa => sa.SongId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<SongArtist>()
            .HasOne(sa => sa.Artist)
            .WithMany(a => a.SongArtists)
            .HasForeignKey(sa => sa.ArtistId)
            .OnDelete(DeleteBehavior.Restrict);

        // AlbumArtist composite PK
        modelBuilder.Entity<AlbumArtist>()
            .HasKey(aa => new { aa.AlbumId, aa.ArtistId });
        modelBuilder.Entity<AlbumArtist>()
            .HasOne(aa => aa.Album)
            .WithMany(a => a.AlbumArtists)
            .HasForeignKey(aa => aa.AlbumId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<AlbumArtist>()
            .HasOne(aa => aa.Artist)
            .WithMany(a => a.AlbumArtists)
            .HasForeignKey(aa => aa.ArtistId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
