import { prisma } from '@/db'
import { IndexItem } from '@prisma/client'

export default async function fetchIndexItems(params:IndexItem) {
    try {
        const res = await prisma.indexItem.findMany()
        
        const indexItems: IndexItem[] = await res.json()

        return indexItems
    } catch (err) {
        if (err instanceof Error) console.error(err.stack)
    }
}  