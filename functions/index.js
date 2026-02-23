// functions/index.js

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");

admin.initializeApp();

/**
 * CONFIGURAÇÃO GLOBAL (Fase 2 - Hardening & CORS)
 * region: europe-west1 (perto de Portugal)
 * cors: true (permite que o Netlify chame a função)
 */
setGlobalOptions({ 
  region: "europe-west1",
  cors: true 
});

/**
 * PROVISIONAMENTO REAL DE UTILIZADOR
 */
exports.inviteTeamMember = onCall(async (request) => {
  // 1. Verificação de Segurança: Utilizador deve estar logado
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Utilizador não autenticado.");
  }

  const callerUid = request.auth.uid;
  const { fullName, email, role, businessId, phone } = request.data;

  // 2. Validação de Permissão (Só OWNER ou MANAGER convidam)
  const callerSnap = await admin.firestore()
    .doc(`businesses/${businessId}/users/${callerUid}`)
    .get();

  const callerData = callerSnap.data();
  if (!callerData || (callerData.role !== "OWNER" && callerData.role !== "MANAGER")) {
    throw new HttpsError("permission-denied", "Não tem permissões administrativas.");
  }

  try {
    // 3. Criar utilizador no Firebase Auth com senha temporária
    const tempPassword = "Nails" + Math.random().toString(36).slice(-8) + "!";
    const userRecord = await admin.auth().createUser({
      email,
      password: tempPassword,
      displayName: fullName,
    });

    const uid = userRecord.uid;

    // 4. Definir Custom Claims (Selo de Segurança no Token)
    await admin.auth().setCustomUserClaims(uid, {
      role: role,
      businessId: businessId
    });

    // 5. Criar Perfil no Firestore
    const userData = {
      uid: uid,
      businessId: businessId,
      fullName: fullName,
      email: email,
      phone: phone || "",
      role: role,
      status: "ACTIVE",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await admin.firestore()
      .doc(`businesses/${businessId}/users/${uid}`)
      .set(userData);

    // 6. Auditoria
    await admin.firestore()
      .collection(`businesses/${businessId}/auditLogs`)
      .add({
        actorUid: callerUid,
        action: "USER_INVITED",
        targetUid: uid,
        details: `Utilizador ${fullName} convidado como ${role}.`,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

    return { 
      success: true, 
      uid: uid, 
      tempPassword: tempPassword 
    };

  } catch (error) {
    console.error("Erro no convite:", error);
    if (error.code === 'auth/email-already-in-use') {
      throw new HttpsError("already-exists", "Este email já está em uso.");
    }
    throw new HttpsError("internal", error.message);
  }
});