using Microsoft.EntityFrameworkCore;
using MusicApp.Core.Entities;
using MusicApp.Core.Interfaces.Repositories;
using MusicApp.Infrastructure.Data;

namespace MusicApp.Infrastructure.Repositories;

public class PlayHistoryRepository : IPlayHistoryRepository
{
    private readonly AppDbContext _context;

    public PlayHistoryRepository(AppDbContext context) => _context = context;

    public async Task AddAsync(PlayHistory history) => await _context.PlayHistories.AddAsync(history);

    public async Task<IEnumerable<PlayHistory>> GetByUserAsync(int userId, int limit = 20)
        => await _context.PlayHistories
            .Include(ph => ph.Song)
                .ThenInclude(s => s.Artist)
            .Where(ph => ph.UserId == userId)
            .OrderByDescending(ph => ph.PlayedAt)
            .Take(limit)
            .ToListAsync();

    public async Task SaveChangesAsync() => await _context.SaveChangesAsync();
}
