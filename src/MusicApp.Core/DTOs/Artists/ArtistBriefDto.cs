namespace MusicApp.Core.DTOs.Artists;
public class ArtistBriefDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
}
