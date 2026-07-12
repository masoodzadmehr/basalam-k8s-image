package com.library.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Base64;
import java.util.Date;
import java.util.UUID;

@Component
public class JwtTokenProvider {

    private final JwtProperties jwtProperties;

    public JwtTokenProvider(JwtProperties jwtProperties) {
        this.jwtProperties = jwtProperties;
    }

    public String generateAccessToken(String username, String role) {
        Date now = new Date();
        Date expiration = new Date(now.getTime() + jwtProperties.getAccessToken().getExpirationMs());

        return Jwts.builder()
                .subject(username)
                .claim("role", role)
                .issuedAt(now)
                .expiration(expiration)
                .signWith(getAccessKey())
                .compact();
    }

    public String generateRefreshToken() {
        Date now = new Date();
        Date expiration = new Date(now.getTime() + jwtProperties.getRefreshToken().getExpirationMs());

        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .issuedAt(now)
                .expiration(expiration)
                .signWith(getRefreshKey())
                .compact();
    }

    public boolean validateAccessToken(String token) {
        try {
            getClaims(token, getAccessKey());
            return true;
        } catch (ExpiredJwtException e) {
            return false;
        } catch (Exception e) {
            return false;
        }
    }

    public boolean validateRefreshToken(String token) {
        try {
            getClaims(token, getRefreshKey());
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public String getUsernameFromToken(String token) {
        return getClaims(token, getAccessKey()).getSubject();
    }

    public String getRoleFromToken(String token) {
        return getClaims(token, getAccessKey()).get("role", String.class);
    }

    public String getTokenId(String token) {
        return getClaims(token, getRefreshKey()).getId();
    }

    public boolean isTokenExpired(String token) {
        try {
            getClaims(token, getAccessKey());
            return false;
        } catch (ExpiredJwtException e) {
            return true;
        }
    }

    public long getAccessTokenExpirationMs() {
        return jwtProperties.getAccessToken().getExpirationMs();
    }

    public long getRefreshTokenExpirationMs() {
        return jwtProperties.getRefreshToken().getExpirationMs();
    }

    private SecretKey getAccessKey() {
        byte[] keyBytes = Base64.getDecoder().decode(jwtProperties.getAccessToken().getSecret());
        return Keys.hmacShaKeyFor(keyBytes);
    }

    private SecretKey getRefreshKey() {
        byte[] keyBytes = Base64.getDecoder().decode(jwtProperties.getRefreshToken().getSecret());
        return Keys.hmacShaKeyFor(keyBytes);
    }

    private Claims getClaims(String token, SecretKey key) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
