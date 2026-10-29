import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { FieldType } from '@prisma/client';
import { logAuditEvent } from '@/lib/audit';

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await props.params;

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      include: {
        userTypes: {
          include: {
            customFields: {
              orderBy: { displayOrder: 'asc' },
            },
          },
        },
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found.' }, { status: 404 });
    }

    return NextResponse.json({ userTypes: tenant.userTypes });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await props.params;
    const body = await req.json();
    const { userTypeId, label, fieldKey, fieldType, isRequired, placeholder, options } = body;

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found.' }, { status: 404 });
    }

    if (!userTypeId || !label || !fieldKey || !fieldType) {
      return NextResponse.json(
        { error: 'User Type, Label, Field Key, and Field Type are required.' },
        { status: 400 }
      );
    }

    // Standardize field key
    const sanitizedKey = fieldKey.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');

    // Check duplicate key
    const existing = await prisma.customField.findFirst({
      where: {
        userTypeId,
        fieldKey: sanitizedKey,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Field key "${sanitizedKey}" already exists for this user type.` },
        { status: 409 }
      );
    }

    const maxOrder = await prisma.customField.aggregate({
      where: { userTypeId },
      _max: { displayOrder: true },
    });

    const newField = await prisma.customField.create({
      data: {
        userTypeId,
        label: label.trim(),
        fieldKey: sanitizedKey,
        fieldType: fieldType as FieldType,
        isRequired: Boolean(isRequired),
        placeholder: placeholder ? placeholder.trim() : null,
        options: options ? options : null,
        displayOrder: (maxOrder._max.displayOrder || 0) + 1,
      },
    });

    await logAuditEvent({
      tenantId: tenant.id,
      action: 'CUSTOM_FIELD_CREATED',
      module: 'USER_TYPES',
      details: { label: newField.label, fieldKey: newField.fieldKey, fieldType: newField.fieldType },
    });

    return NextResponse.json({ success: true, field: newField }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await props.params;
    const { searchParams } = new URL(req.url);
    const fieldId = searchParams.get('id');

    if (!fieldId) {
      return NextResponse.json({ error: 'Field ID is required.' }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found.' }, { status: 404 });
    }

    const field = await prisma.customField.findFirst({
      where: { id: fieldId },
      include: { userType: true },
    });

    if (!field || field.userType.tenantId !== tenant.id) {
      return NextResponse.json({ error: 'Field not found in this tenant.' }, { status: 404 });
    }

    await prisma.customField.delete({
      where: { id: fieldId },
    });

    await logAuditEvent({
      tenantId: tenant.id,
      action: 'CUSTOM_FIELD_DELETED',
      module: 'USER_TYPES',
      details: { fieldKey: field.fieldKey, label: field.label, userType: field.userType.name },
    });

    return NextResponse.json({ success: true, message: `Field "${field.label}" deleted.` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

