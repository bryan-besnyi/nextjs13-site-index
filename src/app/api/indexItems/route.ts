import { PrismaClient } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    // Parse query parameters from req.nextUrl
    const url = req.nextUrl
    const campus = url.searchParams.get('campus')
    const letter = url.searchParams.get('letter')

    // Build conditions using case-insensitive filters
    const conditions: {
      campus?: string
      letter?: { contains: string; mode: 'insensitive' }
    } = {}
    if (campus) conditions.campus = campus
    if (letter) conditions.letter = { contains: letter, mode: 'insensitive' }

    const indexItems = await prisma.indexItem.findMany({
      where: conditions,
    })

    // return JSON data
    return new NextResponse(JSON.stringify(indexItems), {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('Request error', error)
    return new NextResponse(JSON.stringify({ error: 'Error fetching data' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }
}

export async function POST(req: NextRequest, res: NextResponse) {
  try {
    const { title, letter, url, campus } = await req.json() // Parse JSON data from request body

    const newIndexItem = await prisma.indexItem.create({
      data: {
        title: title,
        letter: letter,
        url: url,
        campus: campus,
      },
    })

    return new NextResponse(JSON.stringify(newIndexItem), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error creating index item', error)
    return new NextResponse(
      JSON.stringify({ error: 'Error creating new index item' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }
}
