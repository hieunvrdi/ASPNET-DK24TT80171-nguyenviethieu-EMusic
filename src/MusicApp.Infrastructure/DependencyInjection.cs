using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using MusicApp.Core.Interfaces.Repositories;
using MusicApp.Core.Interfaces.Services;
using MusicApp.Infrastructure.Data;
using MusicApp.Infrastructure.Repositories;
using MusicApp.Infrastructure.Services;

namespace MusicApp.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlServer(configuration.GetConnectionString("Default")));

        services.AddScoped<ISongRepository, SongRepository>();
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IArtistRepository, ArtistRepository>();
        services.AddScoped<IAlbumRepository, AlbumRepository>();
        services.AddScoped<IPlaylistRepository, PlaylistRepository>();
        services.AddScoped<IPlayHistoryRepository, PlayHistoryRepository>();
        services.AddScoped<IFavoriteSongRepository, FavoriteSongRepository>();

        services.AddScoped<IFileService, FileService>();
        services.AddScoped<ITokenService, TokenService>();

        return services;
    }
}
