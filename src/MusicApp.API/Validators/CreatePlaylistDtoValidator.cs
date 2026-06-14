using FluentValidation;
using MusicApp.Core.DTOs.Playlists;

namespace MusicApp.API.Validators;

public class CreatePlaylistDtoValidator : AbstractValidator<CreatePlaylistDto>
{
    public CreatePlaylistDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Playlist name is required.")
            .MaximumLength(100).WithMessage("Playlist name must not exceed 100 characters.");
    }
}

public class UpdatePlaylistDtoValidator : AbstractValidator<UpdatePlaylistDto>
{
    public UpdatePlaylistDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Playlist name is required.")
            .MaximumLength(100).WithMessage("Playlist name must not exceed 100 characters.");
    }
}
