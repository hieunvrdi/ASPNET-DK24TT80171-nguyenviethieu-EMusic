using System.Security.Claims;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MusicApp.Core.DTOs.Auth;
using MusicApp.Core.DTOs.Common;
using MusicApp.Core.Entities;
using MusicApp.Core.Interfaces.Repositories;
using MusicApp.Core.Interfaces.Services;

namespace MusicApp.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IUserRepository _userRepo;
    private readonly ITokenService _tokenService;
    private readonly IMapper _mapper;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        IUserRepository userRepo,
        ITokenService tokenService,
        IMapper mapper,
        ILogger<AuthController> logger)
    {
        _userRepo = userRepo;
        _tokenService = tokenService;
        _mapper = mapper;
        _logger = logger;
    }

    [HttpPost("register")]
    public async Task<ActionResult<ApiResponse<AuthResponseDto>>> Register([FromBody] RegisterDto dto)
    {
        if (await _userRepo.EmailExistsAsync(dto.Email))
        {
            _logger.LogWarning("Register failed: email '{Email}' already in use", dto.Email);
            return BadRequest(ApiResponse<AuthResponseDto>.Fail("Email already in use."));
        }

        if (await _userRepo.UsernameExistsAsync(dto.UserName))
        {
            _logger.LogWarning("Register failed: username '{UserName}' already taken", dto.UserName);
            return BadRequest(ApiResponse<AuthResponseDto>.Fail("Username already taken."));
        }

        var user = new User
        {
            UserName     = dto.UserName,
            Email        = dto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role         = "User",
            CreatedAt    = DateTime.UtcNow
        };

        await _userRepo.AddAsync(user);
        await _userRepo.SaveChangesAsync();

        _logger.LogInformation("New user registered: '{UserName}' ({Email})", user.UserName, user.Email);

        var token = _tokenService.GenerateToken(user);
        return CreatedAtAction(nameof(Me), ApiResponse<AuthResponseDto>.Ok(new AuthResponseDto
        {
            Token    = token,
            UserId   = user.Id,
            UserName = user.UserName,
            Role     = user.Role
        }));
    }

    [HttpPost("login")]
    public async Task<ActionResult<ApiResponse<AuthResponseDto>>> Login([FromBody] LoginDto dto)
    {
        var user = await _userRepo.GetByEmailAsync(dto.Email);
        if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
        {
            _logger.LogWarning("Login failed for email '{Email}'", dto.Email);
            return Unauthorized(ApiResponse<AuthResponseDto>.Fail("Invalid email or password."));
        }

        _logger.LogInformation("User '{UserName}' logged in (role: {Role})", user.UserName, user.Role);

        var token = _tokenService.GenerateToken(user);
        return Ok(ApiResponse<AuthResponseDto>.Ok(new AuthResponseDto
        {
            Token    = token,
            UserId   = user.Id,
            UserName = user.UserName,
            Role     = user.Role
        }));
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<UserDto>>> Me()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var user = await _userRepo.GetByIdAsync(userId);
        if (user == null) return NotFound(ApiResponse<UserDto>.Fail("User not found."));

        return Ok(ApiResponse<UserDto>.Ok(_mapper.Map<UserDto>(user)));
    }
}
