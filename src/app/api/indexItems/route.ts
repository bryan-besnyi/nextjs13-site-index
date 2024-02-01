import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    try {
        // Parse query parameters directly from req.nextUrl
        const url = req.nextUrl;
        const campus = url.searchParams.get('campus');
        const letter = url.searchParams.get('letter');

        const conditions: { campus?: string; letter?: string } = {};
        if (campus) conditions.campus = campus;
        if (letter) conditions.letter = letter;

        const indexItems = await prisma.indexItem.findMany({
            where: conditions,
        });

        // Use NextResponse to return JSON data
        return new NextResponse(JSON.stringify(indexItems), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    } catch (error) {
        console.error('Request error', error);
        return new NextResponse(JSON.stringify({ error: 'Error fetching data' }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }
}

export async function POST(req: NextRequest, res: NextResponse) {
  try {
    const { title, letter, url, campus } = await req.json(); // Parse JSON data from request body

    const newIndexItem = await prisma.indexItem.create({
      data: {
        title: title,
        letter: letter,
        url: url,
        campus: campus,
      },
    });

    return new NextResponse(JSON.stringify(newIndexItem), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error creating index item', error);
    return new NextResponse(JSON.stringify({ error: 'Error creating new index item' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    let json = await request.json();
    const updated_indexItem = await prisma.indexItem.update({
      where: { id },
      data: json,
    });
    let json_response = {
      status: "success",
      data: {
        indexItem: updated_indexItem,
      },
    };
    return NextResponse.json(json_response);
  } catch (error: any) {
    if (error.code === "P2025") {
      let error_response = {
        status: "fail",
        message: "No IndexItem with the Provided ID Found",
      };
      return new NextResponse(JSON.stringify(error_response), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    let error_response = {
      status: "error",
      message: error.message,
    };
    return new NextResponse(JSON.stringify(error_response), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Basic Input Validation: Check if ID is provided
    const id = params.id;
    if (!id) {
      return NextResponse.json({
        status: "fail",
        message: "ID must be provided",
      }).status(400);
    }

    const deletedIndexItem = await prisma.indexItem.delete({
      where: { id },
    });

    return NextResponse.json({
      status: "success",
      data: {
        indexItem: deletedIndexItem,
      },
    });
  } catch (error: any) {
    console.error("Error occurred:", error);  // Log the error for debugging

    if (error.code === "P2025") {
      return new NextResponse(JSON.stringify({
        status: "fail",
        message: "No IndexItem with the Provided ID Found",
      }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new NextResponse(JSON.stringify({
      status: "error",
      message: error.message,
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}