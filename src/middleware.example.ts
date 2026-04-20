import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Simple in-memory rate limiter
// NOTE: For production, use Redis or a distributed rate limiter
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

// Lazy initialization flag to prevent multiple intervals
let cleanupIntervalStarted = false

// Start cleanup interval only once
function startCleanupInterval() {
  if (cleanupIntervalStarted) return
  cleanupIntervalStarted = true
  
  // Cleanup old entries every 5 minutes
  setInterval(() => {
    const now = Date.now()
    for (const [key, value] of rateLimitMap.entries()) {
      if (now > value.resetTime) {
        rateLimitMap.delete(key)
      }
    }
  }, 5 * 60 * 1000)
}

// Rate limit configuration
const RATE_LIMIT_CONFIG = {
  windowMs: 60000, // 1 minute
  maxRequests: 100, // 100 requests per minute
  message: 'Too many requests. Please wait a moment.',
  messageRu: 'Слишком много запросов. Пожалуйста, подождите немного.',
}

export function middleware(request: NextRequest) {
  // Start cleanup interval on first request
  startCleanupInterval()
  
  // Get client IP address
  const ip = request.ip || 
             request.headers.get('x-forwarded-for')?.split(',')[0] || 
             request.headers.get('x-real-ip') || 
             'unknown'
  
  const now = Date.now()
  
  // Get or create rate limit entry
  const rateLimit = rateLimitMap.get(ip)
  
  if (!rateLimit || now > rateLimit.resetTime) {
    // New window or expired window
    rateLimitMap.set(ip, { 
      count: 1, 
      resetTime: now + RATE_LIMIT_CONFIG.windowMs 
    })
  } else {
    // Increment counter
    rateLimit.count++
    
    if (rateLimit.count > RATE_LIMIT_CONFIG.maxRequests) {
      // Rate limit exceeded
      console.warn(
        `[Rate Limit] IP ${ip} exceeded ${RATE_LIMIT_CONFIG.maxRequests} requests per minute`
      )
      
      return NextResponse.json(
        { 
          success: false, 
          message: RATE_LIMIT_CONFIG.messageRu,
          error: RATE_LIMIT_CONFIG.message
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(
              Math.ceil((rateLimit.resetTime - now) / 1000)
            )
          }
        }
      )
    }
  }
  
  return NextResponse.next()
}

// Apply rate limiting only to API routes
export const config = {
  matcher: '/api/:path*',
}
