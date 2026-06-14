namespace MusicApp.Core.DTOs.Genres;
public class GenreDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public int SongCount { get; set; }
}
