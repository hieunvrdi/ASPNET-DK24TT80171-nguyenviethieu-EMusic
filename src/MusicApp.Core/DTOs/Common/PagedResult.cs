namespace MusicApp.Core.DTOs.Common;

public class PagedResult<T>
{
    public bool Success { get; init; } = true;
    public List<T> Data { get; init; } = new();
    public int Total { get; init; }
    public int Page { get; init; }
    public int PageSize { get; init; }
    public string? Message { get; init; }
}
