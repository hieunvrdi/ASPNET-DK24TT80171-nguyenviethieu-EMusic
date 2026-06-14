namespace MusicApp.Core.DTOs.Admin;

public class AdminArtistDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Bio { get; set; }
    public string? AvatarUrl { get; set; }
    public int SongCount { get; set; }
}
