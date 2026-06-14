using AutoMapper;
using MusicApp.Core.DTOs.Admin;
using MusicApp.Core.DTOs.Genres;
using MusicApp.Core.DTOs.Albums;
using MusicApp.Core.DTOs.Artists;
using MusicApp.Core.DTOs.Auth;
using MusicApp.Core.DTOs.Playlists;
using MusicApp.Core.DTOs.Songs;
using MusicApp.Core.Entities;

namespace MusicApp.API.Mappings;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<Artist, ArtistBriefDto>();

        CreateMap<Song, SongDto>()
            .ForMember(d => d.ArtistName,   o => o.MapFrom(s => s.Artist.Name))
            .ForMember(d => d.AlbumTitle,   o => o.MapFrom(s => s.Album != null ? s.Album.Title : null))
            .ForMember(d => d.Status,       o => o.MapFrom(s => s.Status.ToString()))
            .ForMember(d => d.StreamUrl,    o => o.MapFrom(s => $"/api/songs/{s.Id}/stream"))
            // Cover: song-specific first, then album cover as fallback
            .ForMember(d => d.CoverUrl,     o => o.MapFrom(s =>
                s.CoverUrl != null ? s.CoverUrl
                : s.Album != null  ? s.Album.CoverUrl
                : null))
            .ForMember(d => d.UploaderName, o => o.MapFrom(s => s.Uploader != null ? s.Uploader.UserName : null))
            .ForMember(d => d.UploadedBy,   o => o.MapFrom(s => s.UploadedBy))
            .ForMember(d => d.Genres, o => o.MapFrom(s =>
                s.SongGenres.Select(sg => new GenreDto
                {
                    Id = sg.Genre.Id,
                    Name = sg.Genre.Name,
                    Slug = sg.Genre.Slug,
                    SongCount = 0
                }).ToList()))
            .ForMember(d => d.Artists, o => o.MapFrom(s =>
                s.SongArtists.OrderBy(sa => sa.Order).Select(sa => sa.Artist).ToList()));

        CreateMap<User, UserDto>();

        CreateMap<RegisterDto, User>()
            .ForMember(d => d.CreatedAt, o => o.MapFrom(_ => DateTime.UtcNow));

        CreateMap<Artist, ArtistDto>();

        CreateMap<Album, AlbumDto>()
            .ForMember(d => d.ArtistName, o => o.MapFrom(a => a.Artist.Name));

        CreateMap<Playlist, PlaylistDto>()
            .ForMember(d => d.SongCount, o => o.MapFrom(p => p.PlaylistSongs.Count));

        CreateMap<Playlist, PlaylistDetailDto>()
            .ForMember(d => d.Songs, o => o.MapFrom(p =>
                p.PlaylistSongs.OrderBy(ps => ps.OrderIndex).Select(ps => ps.Song)));

        CreateMap<User, AdminUserDto>()
            .ForMember(d => d.SongCount, o => o.MapFrom(u => u.UploadedSongs.Count));

        CreateMap<Genre, GenreDto>()
            .ForMember(d => d.SongCount, o => o.MapFrom(g => g.SongGenres.Count));
    }
}
