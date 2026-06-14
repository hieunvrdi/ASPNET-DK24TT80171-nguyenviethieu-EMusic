using MusicApp.Core.Entities;

namespace MusicApp.Core.Interfaces.Services;

public interface ITokenService
{
    string GenerateToken(User user);
}
