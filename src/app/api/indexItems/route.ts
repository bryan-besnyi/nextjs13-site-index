import { PrismaClient } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';

import { NextResponse } from "next/server";
import { IncomingMessage } from 'http';

const prisma = new PrismaClient();

export async function GET(req: NextApiRequest, res: NextApiResponse) {
   // Get the query params and lowercase them
    const { campus, letter } = req.url.split("?")[1] ? Object.fromEntries(new URLSearchParams(req.url.split("?")[1])) : { campus: null, letter: null };


    let indexItems = null;

    if (campus && letter) {
      indexItems = await prisma.indexItem.findMany({
        where: {
          campus: campus,
          letter: letter,
        },
      });
    } else if (campus) {
      indexItems = await prisma.indexItem.findMany({
        where: {
          campus: campus,
        },
      });
    } else if (letter) {
      indexItems = await prisma.indexItem.findMany({
        where: {
          letter: letter,
        },
      });
    } else {
      indexItems = await prisma.indexItem.findMany();
    }

    return NextResponse.json(indexItems);
}

export async function POST(req: Request) {
  const { title, letter, url, campus } = await req.json();

  const newIndexItem = await prisma.indexItem.create({
    data: {
      title: title,
      letter: letter,
      url: url,
      campus: campus,
    },
  });

  return Response.json(newIndexItem);
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