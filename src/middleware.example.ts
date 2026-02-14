import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Simple in-memory rate limiter
// NOTE: For production, use Redis or a distributed rate limiter
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key)
    }
  }
}, 5 * 60 * 1000)

export function middleware(request: NextRequest) {
  // Get client IP address
  const ip = request.ip || 
             request.headers.get('x-forwarded-for')?.split(',')[0] || 
             request.headers.get('x-real-ip') || 
             'unknown'
  
  const now = Date.now()
  const windowMs = 60000 // 1 minute
  const maxRequests = 100 // 100 requests per minute
  
  // Get or create rate limit entry
  const rateLimit = rateLimitMap.get(ip)
  
  if (!rateLimit || now > rateLimit.resetTime) {
    // New window or expired window
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs })
  } else {
    // Increment counter
    rateLimit.count++
    
    if (rateLimit.count > maxRequests) {
      // Rate limit exceeded
      console.warn(`[Rate Limit] IP ${ip} exceeded ${maxRequests} requests per minute`)
      
      return NextResponse.json(
        { 
          success: false, 
          message: 'Слишком много запросов. Пожалуйста, подождите немного.',
          error: 'Too many requests' 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateLimit.resetTime - now) / 1000))
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
