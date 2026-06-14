using MusicApp.Core.DTOs.Artists;
using MusicApp.Core.DTOs.Genres;
using MusicApp.Core.Enums;

namespace MusicApp.Core.DTOs.Songs;

public class SongDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string ArtistName { get; set; } = string.Empty;
    public int ArtistId { get; set; }
    public string? AlbumTitle { get; set; }
    public int? AlbumId { get; set; }
    public int DurationSeconds { get; set; }
    public int PlayCount { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Lyrics { get; set; }
    public string? CoverUrl { get; set; }
    public int UploadedBy { get; set; }
    public string? UploaderName { get; set; }
    public DateTime UploadedAt { get; set; }
    public string StreamUrl { get; set; } = string.Empty;
    public List<GenreDto> Genres { get; set; } = new();
    public List<ArtistBriefDto> Artists { get; set; } = new();
}
