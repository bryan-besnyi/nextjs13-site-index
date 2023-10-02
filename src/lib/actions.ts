import { prisma } from "@/db"

export async function getIndexItem() {
    try {
        const indexItem = await prisma.indexItem.findFirst()

        return {indexItem}
    } catch (error) {
        return { error }
    }
}

export async function getIndexItems() {
    try {
        const indexItems = await prisma.indexItem.findMany()

        return {indexItems}
    } catch (error) {
        return { error }
    }
}

export async function addIndexItem({id, title, letter, url, campus }) {
    try {
        const indexItem = await prisma.indexItem.create({
            data: {
                id, title, letter, url, campus
            }
        })

        return {indexItem}
    } catch (error) {
        return { error }
    }
}

export async function updateIndexItem({id, title, letter, url, campus}) {
    try {
        const indexItem = await prisma.indexItem.update({
            where: { id },
            data: { title, letter, url, campus }
        })

        return {indexItem}
    } catch (error) {
        return { error }
    }
}

export async function deleteIndexItem({id}) {
    try {
        const indexItem = await prisma.indexItem.delete({
            where: { id }
        })

        return {indexItem}
    } catch (error) {
        return { error }
    }
}