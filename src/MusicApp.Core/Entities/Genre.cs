namespace MusicApp.Core.Entities;
public class Genre
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public ICollection<SongGenre> SongGenres { get; set; } = new List<SongGenre>();
}
